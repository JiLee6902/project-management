import { Injectable } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';

@Injectable()
export class RedisUserSessionService {
  private readonly BLACKLIST_PREFIX = 'token:blacklist';
  private readonly LAST_VALID_TIME_PREFIX = 'user:last_valid_time';

  constructor(private readonly cacheService: RedisCacheService) {}

  /**
   * Add access token to blacklist
   */
  async addAccessTokenToBlacklist(userId: string, jti: string, ttl: number): Promise<void> {
    const key = `${this.BLACKLIST_PREFIX}:${userId}:${jti}`;
    await this.cacheService.set(key, '1', { ttl });
  }

  /**
   * Check if access token is blacklisted
   */
  async isAccessTokenBlacklisted(userId: string, jti: string): Promise<boolean> {
    const key = `${this.BLACKLIST_PREFIX}:${userId}:${jti}`;
    return this.cacheService.exists(key);
  }

  /**
   * Set last valid time for user's access tokens
   */
  async setLastValidTimeOfUserAccessToken(userId: string, timestamp: number): Promise<void> {
    const key = `${this.LAST_VALID_TIME_PREFIX}:${userId}`;
    await this.cacheService.set(key, timestamp.toString());
  }

  /**
   * Get last valid time for user's access tokens
   */
  async getLastValidTime(userId: string): Promise<number | null> {
    const key = `${this.LAST_VALID_TIME_PREFIX}:${userId}`;
    const value = await this.cacheService.get<string>(key);
    return value ? parseInt(value, 10) : null;
  }

  /**
   * Check if access token was issued after the last valid time
   */
  async isAccessTokenIssuedAfterLastValidTime(userId: string, issuedAt: number): Promise<boolean> {
    const lastValidTime = await this.getLastValidTime(userId);
    if (!lastValidTime) return true;
    return issuedAt >= lastValidTime;
  }

  /**
   * Check if access token is valid (not blacklisted and issued after last valid time)
   */
  async isValidAccessToken(userId: string, jti: string, issuedAt: number): Promise<boolean> {
    const isBlacklisted = await this.isAccessTokenBlacklisted(userId, jti);
    if (isBlacklisted) return false;

    return this.isAccessTokenIssuedAfterLastValidTime(userId, issuedAt);
  }
}
