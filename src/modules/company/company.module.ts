import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { Company } from './entities/company.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { Shop } from '../shops/entities/shops.entity';
import { User } from '../users/entities/user.entity';
import { Employee } from '../users/entities/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Warehouse, Shop, User, Employee])],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService]
})

export class CompanyModule {}
