import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { RedisCacheModule } from './shared/cache/cache.module';
import { LoggerModule } from './shared/logger/logger.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import * as config from './config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CacheModule } from '@nestjs/cache-manager';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { CustomerModule } from './modules/customer/customer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [
        config.appConfig,
        config.databaseConfig,
        config.jwtConfig,
        config.redisConfig,
        config.swaggerConfig,
      ],
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    DatabaseModule,
    RedisCacheModule,
    LoggerModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    WarehouseModule,
    CustomerModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
