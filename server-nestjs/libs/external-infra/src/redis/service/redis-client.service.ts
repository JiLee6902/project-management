import { Injectable, OnModuleDestroy, OnModuleInit, Inject } from '@nestjs/common';
import Redis from 'ioredis';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  maxPoolSize?: number;
  connectionTimeout?: number;
  commandTimeout?: number;
}

@Injectable()
export class RedisClientService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(
    @Inject('REDIS_CONFIG')
    private readonly config: RedisConfig,
  ) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.db || 0,

      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },

      connectTimeout: this.config.connectionTimeout || 10000,
      commandTimeout: this.config.commandTimeout || 5000,

      enableReadyCheck: true,
      enableOfflineQueue: true,

      keepAlive: 30000,
      noDelay: true,

      lazyConnect: true,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    this.client.on('ready', () => {
      console.log('Redis Client Ready');
    });

    this.client.on('reconnecting', () => {
      console.log('Redis Client Reconnecting...');
    });

    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}
