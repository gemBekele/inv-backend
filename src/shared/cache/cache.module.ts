import { Module } from '@nestjs/common';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from '@/shared/cache/cache.service';
import { redisConfig } from '@/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [redisConfig],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisConfig = configService.get('redis');
        const url = `redis://${redisConfig.host}:${redisConfig.port}`;
        return {
          store: await redisStore({
            url,
            password: redisConfig.password,
            database: redisConfig.db,
            ttl: redisConfig.ttl,
          }),
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class RedisCacheModule {}