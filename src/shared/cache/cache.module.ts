import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheService } from '@/shared/cache/cache.service';
import { redisConfig } from '@/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [redisConfig],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisConfig = configService.get('redis');
        return {
          store: await redisStore({
            url: `redis://${redisConfig.host}:${redisConfig.port}`,
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
})
export class RedisCacheModule {}