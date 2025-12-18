import { Injectable } from '@nestjs/common';
import { RedisUserSessionService } from './redis-user-session.service';
import { RedisCacheService } from './redis-cache.service';

@Injectable()
export class RedisService {
  constructor(
    private readonly userSessionService: RedisUserSessionService,
    private readonly cacheService: RedisCacheService,
  ) {}

  /**
   * Check if an access token is valid (not blacklisted and issued after the last valid time)
   */
  async isValidAccessToken(userId: string, jti: string, issuedAt: number): Promise<boolean> {
    return this.userSessionService.isValidAccessToken(userId, jti, issuedAt);
  }

  /**
   * Add access token to blacklist
   */
  async addAccessTokenToBlacklist(userId: string, jti: string, ttl: number): Promise<void> {
    return this.userSessionService.addAccessTokenToBlacklist(userId, jti, ttl);
  }

  /**
   * Check if access token is blacklisted
   */
  async isAccessTokenBlacklisted(userId: string, jti: string): Promise<boolean> {
    return this.userSessionService.isAccessTokenBlacklisted(userId, jti);
  }

  /**
   * Set the last valid time of access token for a user
   */
  async setLastValidTimeOfUserAccessToken(userId: string, timestamp: number): Promise<void> {
    return this.userSessionService.setLastValidTimeOfUserAccessToken(userId, timestamp);
  }

  /**
   * Generic cache get
   */
  async get<T>(key: string): Promise<T | null> {
    return this.cacheService.get<T>(key);
  }

  /**
   * Generic cache set
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    return this.cacheService.set(key, value, { ttl });
  }

  /**
   * Generic cache delete
   */
  async del(key: string): Promise<boolean> {
    return this.cacheService.del(key);
  }
}
