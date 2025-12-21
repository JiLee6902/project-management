import { Injectable } from '@nestjs/common';
import { RedisClientService } from './redis-client.service';

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 600,
  HOUR: 3600,
};

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

  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
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

  async delByPattern(pattern: string): Promise<number> {
    const client = this.redisClient.getClient();
    const keys = await client.keys(pattern);
    if (keys.length === 0) return 0;
    return client.del(...keys);
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    const values = await this.redisClient.getClient().mget(...keys);
    return values.map((value) => {
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    });
  }

  async mset(items: { key: string; value: any; ttl?: number }[]): Promise<boolean> {
    if (items.length === 0) return true;
    const pipeline = this.redisClient.getClient().pipeline();
    for (const item of items) {
      const stringValue = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
      if (item.ttl) {
        pipeline.setex(item.key, item.ttl, stringValue);
      } else {
        pipeline.set(item.key, stringValue);
      }
    }
    await pipeline.exec();
    return true;
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

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await factory();
    await this.set(key, value, { ttl });
    return value;
  }

  buildKey(prefix: string, ...parts: (string | number)[]): string {
    return [prefix, ...parts].join(':');
  }
}
