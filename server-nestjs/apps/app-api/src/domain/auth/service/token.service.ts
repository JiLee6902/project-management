import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@app/entity/entities';
import { TokenRepository } from '../repository/token.repository';

@Injectable()
export class TokenService {
  constructor(
    public readonly jwtService: JwtService,
    private readonly tokenRepository: TokenRepository,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      jti: uuidv4(),
    };

    const expiresInMs = Number(
      this.configService.get('JWT_ACCESS_EXPIRATION_MILLISECONDS', 86400000),
    );
    const expiresInSeconds = Math.floor(expiresInMs / 1000);

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: expiresInSeconds,
    });
  }

  async generateRefreshToken(user: User, queryRunner?: QueryRunner): Promise<string> {
    const jti = uuidv4();
    const expiresInMs = Number(
      this.configService.get('JWT_REFRESH_EXPIRATION_MILLISECONDS', 604800000),
    );
    const expiresInSeconds = Math.floor(expiresInMs / 1000);

    const token = this.jwtService.sign(
      { userId: user.id, jti },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: expiresInSeconds,
      },
    );

    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + expiresInMs);

    await this.tokenRepository.saveRefreshToken(
      { jti, user, expiresAt },
      queryRunner,
    );

    return token;
  }

  async revokeRefreshTokenByJti(jti: string, queryRunner?: QueryRunner): Promise<void> {
    await this.tokenRepository.revokeRefreshToken(jti, queryRunner);
  }

  async revokeAllUserRefreshTokens(userId: string, queryRunner?: QueryRunner): Promise<void> {
    await this.tokenRepository.revokeAllUserRefreshTokens(userId, queryRunner);
  }

  async findRefreshTokenByJti(jti: string, queryRunner?: QueryRunner) {
    return this.tokenRepository.findRefreshTokenByJti(jti, queryRunner);
  }

  decodeToken(accessToken: string) {
    return this.jwtService.decode(accessToken);
  }
}
