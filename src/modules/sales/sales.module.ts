import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { Sales } from './entities/sales.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { Product } from '../products/entities/product.entity';
import { SaleItem } from './entities/sales-item.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Shop } from '../shops/entities/shops.entity';
import { User } from '../users/entities/user.entity';
import { Employee } from '../users/entities/employee.entity';
import { CommissionModule } from '../commission/commission.module';
import { RedisCacheModule } from '@/shared/cache/cache.module';
import { WarehouseProduct } from '../warehouse/entities/warehouse-product.entity';
import { ShopProduct } from '../shops/entities/shop-product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sales,
      Customer,
      Warehouse,
      Product,
      SaleItem,
      PaymentTransaction,
      AuditLog,
      Shop,
      User,
      Employee,
      WarehouseProduct,
      ShopProduct,
    ]),
    CommissionModule,
    RedisCacheModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
