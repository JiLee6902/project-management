import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User, UserRefreshToken, GuestSession } from '@app/entity/entities';
import { RedisModule } from '@app/external-infra';
import { RolesGuard } from '@app/shared-libs';

import { AuthPublicController } from './controller/auth-public.controller';
import { AuthPrivateController } from './controller/auth-private.controller';
import { AuthOAuthController } from './controller/auth-oauth.controller';
import { AuthService } from './service/auth.service';
import { TokenService } from './service/token.service';
import { AuthRepository } from './repository/auth.repository';
import { TokenRepository } from './repository/token.repository';
import { JwtStrategy } from './strategy/jwt.strategy';
import { GoogleStrategy } from './strategy/google.strategy';
import { GithubStrategy } from './strategy/github.strategy';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { GoogleAuthGuard } from './guard/google-auth.guard';
import { GithubAuthGuard } from './guard/github-auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Math.floor(
            configService.get<number>('JWT_ACCESS_EXPIRATION_MILLISECONDS', 86400000) / 1000,
          ),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, UserRefreshToken, GuestSession]),
    RedisModule,
  ],
  controllers: [AuthPublicController, AuthPrivateController, AuthOAuthController],
  providers: [
    AuthService,
    AuthRepository,
    TokenService,
    TokenRepository,
    JwtStrategy,
    GoogleStrategy,
    GithubStrategy,
    JwtAuthGuard,
    GoogleAuthGuard,
    GithubAuthGuard,
    RolesGuard,
  ],
  exports: [JwtAuthGuard, RolesGuard, AuthService],
})
export class AuthModule {}
