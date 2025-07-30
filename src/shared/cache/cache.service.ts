import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      console.warn('Cache get error:', error.message);
      return undefined;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      console.warn('Cache set error:', error.message);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      console.warn('Cache del error:', error.message);
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    try {
      // Access the underlying store to use the keys method
      const store = (this.cacheManager as any).store;
      
      // Check if store exists and has keys method
      if (!store || typeof store.keys !== 'function') {
        console.warn('Cache store does not support pattern deletion, skipping...');
        return 0;
      }
      
      const keys: string[] = await store.keys(pattern);
      if (keys && keys.length > 0) {
        await Promise.all(keys.map((key: string) => this.cacheManager.del(key)));
        return keys.length;
      }
      return 0;
    } catch (error) {
      console.warn('Error deleting cache pattern:', error.message);
      return 0;
    }
  }

  generateKey(...args: string[]): string {
    return args.join(':');
  }
}