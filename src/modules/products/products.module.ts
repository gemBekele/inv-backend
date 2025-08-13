import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { WarehouseProduct } from '../warehouse/entities/warehouse-product.entity';
import { ShopProduct } from '../shops/entities/shop-product.entity';
import { CacheService } from '@/shared/cache/cache.service';
import { RedisCacheModule } from '@/shared/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, WarehouseProduct, ShopProduct]),
    RedisCacheModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-excel', // .xls
          'text/csv', // .csv
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error('Only Excel and CSV files are allowed'), false);
        }
      },
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, CacheService],
  exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule {}