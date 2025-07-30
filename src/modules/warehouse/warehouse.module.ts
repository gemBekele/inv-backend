import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { WarehouseProduct } from './entities/warehouse-product.entity';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { Product } from '../products/entities/product.entity';
import { Shop } from '../shops/entities/shops.entity';
import { Company } from '../company/entities/company.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Warehouse, WarehouseProduct, Product, Shop, Company, User]),
  ],
  controllers: [WarehouseController],
  providers: [WarehouseService],
  exports: [WarehouseService, TypeOrmModule],
})
export class WarehouseModule {}
