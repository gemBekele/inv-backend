import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import {
  InventoryReportQueryDto,
  SalesReportQueryDto,
  PurchaseReportQueryDto,
  ExpenseReportQueryDto,
  BaseReportQueryDto,
  InventoryReportDto,
  SalesReportDto,
  ReportFormat,
  ReportPeriod,
  GroupBy
} from './dto/report.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { User } from '../users/entities/user.entity';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // INVENTORY REPORTS
  @Get('inventory')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate comprehensive inventory report' })
  @ApiResponse({ status: 200, description: 'Inventory report', type: InventoryReportDto })
  async getInventoryReport(@Query() query: InventoryReportQueryDto) {
    return this.reportsService.getInventoryReport(query);
  }

  @Get('inventory/valuation')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate stock valuation report' })
  @ApiResponse({ status: 200, description: 'Stock valuation report' })
  async getStockValuationReport(@Query() query: InventoryReportQueryDto) {
    return this.reportsService.getStockValuationReport(query);
  }

  @Get('inventory/low-stock')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate low stock alert report' })
  @ApiResponse({ status: 200, description: 'Low stock report' })
  async getLowStockReport(@Query() query: InventoryReportQueryDto) {
    return this.reportsService.getLowStockReport(query);
  }

  @Get('inventory/expired')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE)
  @ApiOperation({ summary: 'Generate expired products report' })
  @ApiResponse({ status: 200, description: 'Expired products report' })
  async getExpiredProductsReport(@Query() query: InventoryReportQueryDto) {
    return this.reportsService.getExpiredProductsReport(query);
  }

  @Get('inventory/movement')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate inventory movement report' })
  @ApiResponse({ status: 200, description: 'Inventory movement report' })
  async getInventoryMovementReport(@Query() query: InventoryReportQueryDto) {
    return this.reportsService.getInventoryMovementReport(query);
  }

  // SALES REPORTS
  @Get('sales')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate comprehensive sales report' })
  @ApiResponse({ status: 200, description: 'Sales report', type: SalesReportDto })
  async getSalesReport(
    @Query() query: SalesReportQueryDto,
    @CurrentUser() user: User
  ) {
    // Apply company filtering for non-super-admin users
    if (user.role !== UserRole.SUPER_ADMIN && user.company?.id) {
      query.companyId = user.company.id;
    }
    return this.reportsService.getSalesReport(query);
  }

  @Get('sales/by-product')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate sales report grouped by product' })
  @ApiResponse({ status: 200, description: 'Sales by product report' })
  async getSalesByProductReport(
    @Query() query: SalesReportQueryDto,
    @CurrentUser() user: User
  ) {
    if (user.role !== UserRole.SUPER_ADMIN && user.company?.id) {
      query.companyId = user.company.id;
    }
    return this.reportsService.getSalesByProductReport(query);
  }

  @Get('sales/by-employee')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate sales report grouped by employee' })
  @ApiResponse({ status: 200, description: 'Sales by employee report' })
  async getSalesByEmployeeReport(
    @Query() query: SalesReportQueryDto,
    @CurrentUser() user: User
  ) {
    if (user.role !== UserRole.SUPER_ADMIN && user.company?.id) {
      query.companyId = user.company.id;
    }
    return this.reportsService.getSalesByEmployeeReport(query);
  }

  @Get('sales/by-customer')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate sales report grouped by customer' })
  @ApiResponse({ status: 200, description: 'Sales by customer report' })
  async getSalesByCustomerReport(
    @Query() query: SalesReportQueryDto,
    @CurrentUser() user: User
  ) {
    if (user.role !== UserRole.SUPER_ADMIN && user.company?.id) {
      query.companyId = user.company.id;
    }
    return this.reportsService.getSalesByCustomerReport(query);
  }

  @Get('sales/commission')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate commission report' })
  @ApiResponse({ status: 200, description: 'Commission report' })
  async getCommissionReport(
    @Query() query: SalesReportQueryDto,
    @CurrentUser() user: User
  ) {
    if (user.role !== UserRole.SUPER_ADMIN && user.company?.id) {
      query.companyId = user.company.id;
    }
    return this.reportsService.getCommissionReport(query);
  }

  // PURCHASE REPORTS
  @Get('purchases')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate comprehensive purchase report' })
  @ApiResponse({ status: 200, description: 'Purchase report' })
  async getPurchaseReport(@Query() query: PurchaseReportQueryDto) {
    return this.reportsService.getPurchaseReport(query);
  }

  @Get('purchases/by-supplier')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate purchase report grouped by supplier' })
  @ApiResponse({ status: 200, description: 'Purchase by supplier report' })
  async getPurchaseBySupplierReport(@Query() query: PurchaseReportQueryDto) {
    return this.reportsService.getPurchaseBySupplierReport(query);
  }

  // EXPENSE REPORTS
  @Get('expenses')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate comprehensive expense report' })
  @ApiResponse({ status: 200, description: 'Expense report' })
  async getExpenseReport(@Query() query: ExpenseReportQueryDto) {
    return this.reportsService.getExpenseReport(query);
  }

  @Get('expenses/by-category')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate expense report grouped by category' })
  @ApiResponse({ status: 200, description: 'Expense by category report' })
  async getExpenseByCategoryReport(@Query() query: ExpenseReportQueryDto) {
    return this.reportsService.getExpenseByCategoryReport(query);
  }

  // EMPLOYEE REPORTS
  @Get('employees/performance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate employee performance report' })
  @ApiResponse({ status: 200, description: 'Employee performance report' })
  async getEmployeePerformanceReport(@Query() query: BaseReportQueryDto) {
    return this.reportsService.getEmployeePerformanceReport(query);
  }

  // COMPANY REPORTS
  @Get('company/overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Generate company overview report' })
  @ApiResponse({ status: 200, description: 'Company overview report' })
  async getCompanyOverviewReport(@Query() query: BaseReportQueryDto) {
    return this.reportsService.getCompanyOverviewReport(query);
  }

  @Get('company/profit-loss')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Generate profit & loss report' })
  @ApiResponse({ status: 200, description: 'Profit & loss report' })
  async getProfitLossReport(@Query() query: BaseReportQueryDto) {
    return this.reportsService.getProfitLossReport(query);
  }

  // DASHBOARD SUMMARY REPORTS
  @Get('dashboard/summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate dashboard summary with key metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard summary' })
  async getDashboardSummary(@Query() query: BaseReportQueryDto) {
    // Aggregate multiple reports for dashboard
    const [
      inventoryReport,
      salesReport,
      expenseReport
    ] = await Promise.all([
      this.reportsService.getInventoryReport(query as InventoryReportQueryDto),
      this.reportsService.getSalesReport(query as SalesReportQueryDto),
      this.reportsService.getExpenseReport(query as ExpenseReportQueryDto)
    ]);

    return {
      metadata: {
        generatedAt: new Date(),
        periodStart: new Date(query.startDate || new Date()),
        periodEnd: new Date(query.endDate || new Date()),
        filters: query
      },
      inventory: {
        totalProducts: inventoryReport.summary.totalProducts,
        totalStockValue: inventoryReport.summary.totalStockValue,
        lowStockItems: inventoryReport.summary.lowStockItems,
        expiredItems: inventoryReport.summary.expiredItems
      },
      sales: {
        totalSales: salesReport.summary.totalSales,
        totalRevenue: salesReport.summary.totalRevenue,
        averageSaleAmount: salesReport.summary.averageSaleAmount,
        totalCustomers: salesReport.summary.totalCustomers
      },
      expenses: {
        totalExpenses: expenseReport.summary.totalExpenses,
        totalAmount: expenseReport.summary.totalAmount
      }
    };
  }

  // WAREHOUSE-SPECIFIC REPORTS
  @Get('warehouse/:warehouseId/summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate warehouse-specific summary report' })
  @ApiResponse({ status: 200, description: 'Warehouse summary report' })
  async getWarehouseSummaryReport(
    @Query('warehouseId') warehouseId: string,
    @Query() query: InventoryReportQueryDto
  ) {
    return this.reportsService.getInventoryReport({
      ...query,
      warehouseId
    });
  }

  // SHOP-SPECIFIC REPORTS  
  @Get('shop/:shopId/summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate shop-specific summary report' })
  @ApiResponse({ status: 200, description: 'Shop summary report' })
  async getShopSummaryReport(
    @Query('shopId') shopId: string,
    @Query() query: SalesReportQueryDto
  ) {
    return this.reportsService.getSalesReport({
      ...query,
      shopId
    });
  }

  // BRANCH-SPECIFIC REPORTS
  @Get('branch/:branchId/summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate branch-specific summary report' })
  @ApiResponse({ status: 200, description: 'Branch summary report' })
  async getBranchSummaryReport(
    @Query('branchId') branchId: string,
    @Query() query: SalesReportQueryDto
  ) {
    return this.reportsService.getSalesReport({
      ...query,
      branchId
    });
  }
}
