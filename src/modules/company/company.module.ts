import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { Company } from './entities/company.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Warehouse])],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService]
})

export class CompanyModule {}
