import { Module } from '@nestjs/common';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../company/entities/company.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { Shop } from './entities/shops.entity';
import { CacheService } from '@/shared/cache/cache.service';

@Module({
  imports: [TypeOrmModule.forFeature([Shop, Warehouse, Company])],
  controllers: [ShopsController],
  providers: [ShopsService, CacheService]
})
export class ShopsModule {}
