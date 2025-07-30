import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commission } from './entities/commission.entity';
import { CommissionService } from './commission.service';
import { Sales } from '../sales/entities/sales.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Employee } from '../users/entities/employee.entity';
import { CommissionController } from './commission.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Commission, User, Product, Sales, Employee])],
  controllers: [CommissionController],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
