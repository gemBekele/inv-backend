import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customer/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { Shop } from '../shops/entities/shops.entity';
import { User } from '../users/entities/user.entity';
import { SaleItem } from './entities/sales-item.entity';
import { Sales } from './entities/sales.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Discount } from './entities/discount.entity';
import { CacheService } from '@/shared/cache/cache.service';
import { CommissionModule } from '../commission/commission.module';
import { Employee } from '../users/entities/employee.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sales, 
      Customer, 
      Product, 
      Warehouse, 
      Shop,
      User,
      SaleItem, 
      PaymentTransaction,
      AuditLog,
      Discount,
      Employee
    ]),
    CommissionModule,
  ],
  controllers: [SalesController],
  providers: [SalesService, CacheService],
  exports: [SalesService],
})
export class SalesModule {}
