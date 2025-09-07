import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { InventoryReportsService } from './services/inventory-reports.service';
import { SalesReportsService } from './services/sales-reports.service';
import { PurchaseReportsService } from './services/purchase-reports.service';
import { ExpenseReportsService } from './services/expense-reports.service';
import { EmployeeReportsService } from './services/employee-reports.service';
import { CompanyReportsService } from './services/company-reports.service';

// Import all entities needed for reporting
import { Product } from '../products/entities/product.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { WarehouseProduct } from '../warehouse/entities/warehouse-product.entity';
import { Shop } from '../shops/entities/shops.entity';
import { Sales } from '../sales/entities/sales.entity';
import { SaleItem } from '../sales/entities/sales-item.entity';
import { PurchaseOrder } from '../purchase/entities/purchase-order.entity';
import { PurchaseItem } from '../purchase/entities/purchase-item.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Employee } from '../users/entities/employee.entity';
import { User } from '../users/entities/user.entity';
import { Company } from '../company/entities/company.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Commission } from '../commission/entities/commission.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Supplier } from '../supplier/entities/supplier.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Warehouse,
      WarehouseProduct,
      Shop,
      Sales,
      SaleItem,
      PurchaseOrder,
      PurchaseItem,
      Expense,
      Employee,
      User,
      Company,
      Customer,
      Commission,
      Branch,
      Supplier,
    ])
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    InventoryReportsService,
    SalesReportsService,
    PurchaseReportsService,
    ExpenseReportsService,
    EmployeeReportsService,
    CompanyReportsService,
  ],
  exports: [
    ReportsService,
    InventoryReportsService,
    SalesReportsService,
    PurchaseReportsService,
    ExpenseReportsService,
    EmployeeReportsService,
    CompanyReportsService,
  ]
})
export class ReportsModule {}
