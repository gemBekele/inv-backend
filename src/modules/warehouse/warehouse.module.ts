import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { WarehouseProduct } from './entities/warehouse-product.entity';
import { Transfer } from './entities/transfer.entity';
import { TransferItem } from './entities/transfer-item.entity';
import { WarehouseService } from './services/warehouse.service';
import { TransferService } from './services/transfer.service';
import { WarehouseController } from './controllers/warehouse.controller';
import { TransferController } from './controllers/transfer.controller';
import { Product } from '../products/entities/product.entity';
import { Shop } from '../shops/entities/shops.entity';
import { ShopProduct } from '../shops/entities/shop-product.entity';
import { Company } from '../company/entities/company.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Warehouse, 
      WarehouseProduct, 
      Transfer, 
      TransferItem,
      Product, 
      Shop, 
      ShopProduct,
      Company, 
      User
    ]),
  ],
  controllers: [WarehouseController, TransferController],
  providers: [WarehouseService, TransferService],
  exports: [WarehouseService, TransferService, TypeOrmModule],
})
export class WarehouseModule {}
