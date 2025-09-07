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
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { CustomerModule } from './modules/customer/customer.module';
import { CompanyModule } from './modules/company/company.module';
import { ShopsModule } from '@/modules/shops/shops.module';
import { SalesModule } from '@/modules/sales/sales.module';
import { CommissionModule } from '@/modules/commission/commission.module';
import { CollectionsModule } from '@/modules/collections/collections.module';
import { SettingsModule } from '@/modules/settings/settings.module';
import { PurchaseModule } from '@/modules/purchase/purchase.module';
import { ExpensesModule } from '@/modules/expenses/expenses.module';
import { BranchModule } from '@/modules/branch/branch.module';
import { SupplierModule } from '@/modules/supplier/supplier.module';
import { ReportsModule } from '@/modules/reports/reports.module';
import { CreditModule } from '@/modules/credit/credit.module';

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
    DatabaseModule,
    RedisCacheModule,
    LoggerModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    WarehouseModule,
    CustomerModule,
    CompanyModule,
    ShopsModule,
    SalesModule,
    CommissionModule,
    CollectionsModule,
    SettingsModule,
    PurchaseModule,
    ExpensesModule,
    BranchModule,
    SupplierModule,
    ReportsModule,
    CreditModule,
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
