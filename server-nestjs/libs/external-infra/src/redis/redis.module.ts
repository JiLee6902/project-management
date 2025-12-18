import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisClientService } from './service/redis-client.service';
import { RedisCacheService } from './service/redis-cache.service';
import { RedisUserSessionService } from './service/redis-user-session.service';
import { RedisService } from './service/redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CONFIG',
      useFactory: (configService: ConfigService) => ({
        host: configService.get<string>('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        password: configService.get<string>('REDIS_PASSWORD') || undefined,
      }),
      inject: [ConfigService],
    },
    RedisClientService,
    RedisCacheService,
    RedisUserSessionService,
    RedisService,
  ],
  exports: [RedisClientService, RedisCacheService, RedisUserSessionService, RedisService],
})
export class RedisModule {}
