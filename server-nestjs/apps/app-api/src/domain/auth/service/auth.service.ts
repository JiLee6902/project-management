import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@app/entity/entities';
import { RedisService } from '@app/external-infra';
import { AuthRepository } from '../repository/auth.repository';
import { TokenService } from './token.service';
import { RegisterDto, LoginDto, RefreshTokenDto, LoginResponseDto } from '../dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user already exists
      const existingUser = await this.authRepo.findUserByEmail(
        registerDto.email,
        queryRunner,
      );

      if (existingUser) {
        throw new BadRequestException('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Create user
      const user = await this.authRepo.createUser(
        {
          email: registerDto.email,
          password: hashedPassword,
          name: registerDto.name,
        },
        queryRunner,
      );

      // Generate tokens
      const [accessToken, refreshToken] = await Promise.all([
        this.tokenService.generateAccessToken(user),
        this.tokenService.generateRefreshToken(user, queryRunner),
      ]);

      await queryRunner.commitTransaction();

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find user
      const user = await this.authRepo.findUserByEmail(loginDto.email, queryRunner);

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Generate tokens
      const [accessToken, refreshToken] = await Promise.all([
        this.tokenService.generateAccessToken(user),
        this.tokenService.generateRefreshToken(user, queryRunner),
      ]);

      await queryRunner.commitTransaction();

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async logout(userId: string, accessToken: string): Promise<void> {
    const expiresIn = Math.floor(
      this.configService.get<number>('JWT_ACCESS_EXPIRATION_MILLISECONDS', 86400000) / 1000,
    );

    const payload = this.tokenService.decodeToken(accessToken);
    const jti = (payload as any)?.jti;

    if (jti) {
      await this.redisService.addAccessTokenToBlacklist(userId, jti, expiresIn);
    }
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<LoginResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!refreshTokenDto.refreshToken) {
        throw new UnauthorizedException('Refresh token is required');
      }

      // Verify refresh token
      let decodedToken: any;
      try {
        decodedToken = this.tokenService.jwtService.verify(refreshTokenDto.refreshToken, {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        });
      } catch {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (!decodedToken?.jti) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Find refresh token in database
      const userRefreshToken = await this.tokenService.findRefreshTokenByJti(
        decodedToken.jti,
        queryRunner,
      );

      if (!userRefreshToken) {
        throw new UnauthorizedException('Refresh token not found or revoked');
      }

      // Check expiration
      if (userRefreshToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token has expired');
      }

      // Get user
      const user = await this.authRepo.findUserById(
        userRefreshToken.userId,
        queryRunner,
      );

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Revoke old refresh token
      await this.tokenService.revokeRefreshTokenByJti(decodedToken.jti, queryRunner);

      // Generate new tokens
      const [accessToken, refreshToken] = await Promise.all([
        this.tokenService.generateAccessToken(user),
        this.tokenService.generateRefreshToken(user, queryRunner),
      ]);

      await queryRunner.commitTransaction();

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
