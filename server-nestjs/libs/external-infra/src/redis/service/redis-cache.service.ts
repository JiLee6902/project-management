import { Injectable } from '@nestjs/common';
import { RedisClientService } from './redis-client.service';

@Injectable()
export class RedisCacheService {
  constructor(private readonly redisClient: RedisClientService) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.getClient().get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set(key: string, value: any, options?: { ttl?: number }): Promise<boolean> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    if (options?.ttl) {
      await this.redisClient.getClient().setex(key, options.ttl, stringValue);
    } else {
      await this.redisClient.getClient().set(key, stringValue);
    }

    return true;
  }

  async del(key: string): Promise<boolean> {
    const result = await this.redisClient.getClient().del(key);
    return result > 0;
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redisClient.getClient().exists(key);
    return result > 0;
  }

  async getTTL(key: string): Promise<number> {
    return this.redisClient.getClient().ttl(key);
  }

  async incr(key: string): Promise<number> {
    return this.redisClient.getClient().incr(key);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.redisClient.getClient().expire(key, seconds);
    return result === 1;
  }
}
