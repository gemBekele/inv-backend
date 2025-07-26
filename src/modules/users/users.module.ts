import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { User } from './entities/user.entity';
import { EmployeeService } from './services/employee.service';
import { Shop } from '../shops/entities/shops.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { Employee } from './entities/employee.entity';
import { CacheService } from '@/shared/cache/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Employee, Shop, Warehouse]),
],
  controllers: [UsersController],
  providers: [UsersService, EmployeeService, CacheService],
  exports: [UsersService, EmployeeService, TypeOrmModule],
})
export class UsersModule {}