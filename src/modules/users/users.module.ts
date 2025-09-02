import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { User } from './entities/user.entity';
import { EmployeeService } from './services/employee.service';
import { EmployeeDashboardService } from './services/employee-dashboard.service';
import { Shop } from '../shops/entities/shops.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { Company } from '../company/entities/company.entity';
import { Employee } from './entities/employee.entity';
import { CacheService } from '@/shared/cache/cache.service';
import { EmployeeController } from './controllers/employee.controller';
import { Sales } from '../sales/entities/sales.entity';
import { Commission } from '../commission/entities/commission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Employee, Shop, Warehouse, Company, Sales, Commission]),
],
  controllers: [UsersController, EmployeeController],
  providers: [UsersService, EmployeeService, EmployeeDashboardService, CacheService],
  exports: [UsersService, EmployeeService, EmployeeDashboardService, TypeOrmModule],
})
export class UsersModule {}