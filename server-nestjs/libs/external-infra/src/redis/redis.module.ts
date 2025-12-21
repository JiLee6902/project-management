import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisClientService } from './service/redis-client.service';
import { RedisCacheService } from './service/redis-cache.service';
import { RedisUserSessionService } from './service/redis-user-session.service';
import { RedisService } from './service/redis.service';
import { BloomFilterService } from './service/bloom-filter.service';

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
        db: configService.get<number>('REDIS_DB', 0),
        connectionTimeout: configService.get<number>('REDIS_CONNECTION_TIMEOUT', 10000),
        commandTimeout: configService.get<number>('REDIS_COMMAND_TIMEOUT', 5000),
      }),
      inject: [ConfigService],
    },
    RedisClientService,
    RedisCacheService,
    RedisUserSessionService,
    RedisService,
    BloomFilterService,
  ],
  exports: [RedisClientService, RedisCacheService, RedisUserSessionService, RedisService, BloomFilterService],
})
export class RedisModule {}
