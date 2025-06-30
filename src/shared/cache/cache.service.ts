import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CACHE_TTL } from '../../common/constants';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl || CACHE_TTL.MEDIUM);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  async keys(pattern?: string): Promise<string[]> {
    if (!pattern) {
      return [];
    }
    // Note: This depends on the cache store implementation
    return [];
  }

  async mget<T>(...keys: string[]): Promise<(T | undefined)[]> {
    const promises = keys.map(key => this.get<T>(key));
    return Promise.all(promises);
  }

  async mset<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    const promises = keyValuePairs.map(({ key, value, ttl }) => 
      this.set(key, value, ttl)
    );
    await Promise.all(promises);
  }

  async increment(key: string, amount = 1): Promise<number> {
    const current = await this.get<number>(key) || 0;
    const newValue = current + amount;
    await this.set(key, newValue);
    return newValue;
  }

  async decrement(key: string, amount = 1): Promise<number> {
    return this.increment(key, -amount);
  }

  generateKey(...parts: string[]): string {
    return parts.join(':');
  }
}