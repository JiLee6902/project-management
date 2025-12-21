import { Injectable } from '@nestjs/common';
import { RedisClientService } from './redis-client.service';

export interface BloomFilterConfig {
  size?: number;
  hashCount?: number;
}

@Injectable()
export class BloomFilterService {
  private readonly DEFAULT_SIZE = 1000000;
  private readonly DEFAULT_HASH_COUNT = 7;

  constructor(private readonly redisClient: RedisClientService) {}

  private hash(value: string, seed: number, size: number): number {
    let hash = seed;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) + hash + value.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % size;
  }

  private getConfig(config?: BloomFilterConfig) {
    return {
      size: config?.size || this.DEFAULT_SIZE,
      hashCount: config?.hashCount || this.DEFAULT_HASH_COUNT,
    };
  }

  private getKey(filterName: string): string {
    return `bloom:${filterName}`;
  }

  async add(
    filterName: string,
    value: string,
    config?: BloomFilterConfig,
  ): Promise<void> {
    const { size, hashCount } = this.getConfig(config);
    const key = this.getKey(filterName);
    const client = this.redisClient.getClient();
    const pipeline = client.pipeline();

    for (let i = 0; i < hashCount; i++) {
      const bit = this.hash(value, i, size);
      pipeline.setbit(key, bit, 1);
    }

    await pipeline.exec();
  }

  async addMany(
    filterName: string,
    values: string[],
    config?: BloomFilterConfig,
  ): Promise<void> {
    if (values.length === 0) return;

    const { size, hashCount } = this.getConfig(config);
    const key = this.getKey(filterName);
    const client = this.redisClient.getClient();
    const pipeline = client.pipeline();

    for (const value of values) {
      for (let i = 0; i < hashCount; i++) {
        const bit = this.hash(value, i, size);
        pipeline.setbit(key, bit, 1);
      }
    }

    await pipeline.exec();
  }

  async exists(
    filterName: string,
    value: string,
    config?: BloomFilterConfig,
  ): Promise<boolean> {
    const { size, hashCount } = this.getConfig(config);
    const key = this.getKey(filterName);
    const client = this.redisClient.getClient();

    for (let i = 0; i < hashCount; i++) {
      const bit = this.hash(value, i, size);
      const result = await client.getbit(key, bit);
      if (result === 0) {
        return false;
      }
    }

    return true;
  }

  async existsBatch(
    filterName: string,
    values: string[],
    config?: BloomFilterConfig,
  ): Promise<Map<string, boolean>> {
    const { size, hashCount } = this.getConfig(config);
    const key = this.getKey(filterName);
    const client = this.redisClient.getClient();
    const results = new Map<string, boolean>();

    for (const value of values) {
      let mayExist = true;

      for (let i = 0; i < hashCount; i++) {
        const bit = this.hash(value, i, size);
        const result = await client.getbit(key, bit);
        if (result === 0) {
          mayExist = false;
          break;
        }
      }

      results.set(value, mayExist);
    }

    return results;
  }

  async clear(filterName: string): Promise<void> {
    const key = this.getKey(filterName);
    await this.redisClient.getClient().del(key);
  }

  async getStats(filterName: string): Promise<{
    exists: boolean;
    sizeInBytes: number;
    bitCount: number;
  }> {
    const key = this.getKey(filterName);
    const client = this.redisClient.getClient();

    const exists = await client.exists(key);
    if (!exists) {
      return { exists: false, sizeInBytes: 0, bitCount: 0 };
    }

    const sizeInBytes = await client.strlen(key);
    const bitCount = await client.bitcount(key);

    return {
      exists: true,
      sizeInBytes,
      bitCount,
    };
  }
}
