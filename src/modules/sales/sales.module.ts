import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customer/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { SaleItem } from './entities/sales-item.entity';
import { Sales } from './entities/sales.entity';
import { CacheService } from '@/shared/cache/cache.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sales, Customer, Product, Warehouse, SaleItem])],
  controllers: [SalesController],
  providers: [SalesService, CacheService]
})
export class SalesModule {}
