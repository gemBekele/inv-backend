import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async deletePattern(pattern: string): Promise<number> {
    // Access the underlying store to use the keys method
    const store = (this.cacheManager as any).store;
    if (typeof store.keys !== 'function') {
      throw new Error('Cache store does not support keys()');
    }
    const keys: string[] = await store.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map((key: string) => this.cacheManager.del(key)));
    }
    return keys.length;
  }

  generateKey(...args: string[]): string {
    return args.join(':');
  }
}