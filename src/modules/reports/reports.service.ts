import { Injectable } from '@nestjs/common';
import { InventoryReportsService } from './services/inventory-reports.service';
import { SalesReportsService } from './services/sales-reports.service';
import { PurchaseReportsService } from './services/purchase-reports.service';
import { ExpenseReportsService } from './services/expense-reports.service';
import { EmployeeReportsService } from './services/employee-reports.service';
import { CompanyReportsService } from './services/company-reports.service';
import {
  BaseReportQueryDto,
  InventoryReportQueryDto,
  SalesReportQueryDto,
  PurchaseReportQueryDto,
  ExpenseReportQueryDto,
  ReportPeriod
} from './dto/report.dto';
import moment from 'moment';

@Injectable()
export class ReportsService {
  constructor(
    private readonly inventoryReportsService: InventoryReportsService,
    private readonly salesReportsService: SalesReportsService,
    private readonly purchaseReportsService: PurchaseReportsService,
    private readonly expenseReportsService: ExpenseReportsService,
    private readonly employeeReportsService: EmployeeReportsService,
    private readonly companyReportsService: CompanyReportsService,
  ) {}

  // Inventory Reports
  async getInventoryReport(query: InventoryReportQueryDto) {
    const dateRange = this.getDateRange(query);
    return this.inventoryReportsService.generateInventoryReport({
      ...query,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  }

  async getStockValuationReport(query: InventoryReportQueryDto) {
    const dateRange = this.getDateRange(query);
    return this.inventoryReportsService.generateStockValuationReport({
      ...query,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  }

  async getLowStockReport(query: InventoryReportQueryDto) {
    return this.inventoryReportsService.generateLowStockReport(query);
  }

  async getExpiredProductsReport(query: InventoryReportQueryDto) {
    return this.inventoryReportsService.generateExpiredProductsReport(query);
  }

  async getInventoryMovementReport(query: InventoryReportQueryDto) {
    const dateRange = this.getDateRange(query);
    return this.inventoryReportsService.generateInventoryMovementReport({
      ...query,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  }

  // Sales Reports
  async getSalesReport(query: SalesReportQueryDto) {
    const dateRange = this.getDateRange(query);
    return this.salesReportsService.generateSalesReport({
      ...query,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  }

  async getSalesByProductReport(query: SalesReportQueryDto) {
    const dateRange = this.getDateRange(query);
    return this.salesReportsService.generateSalesByProductReport({
      ...query,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  }

  async getSalesByEmployeeReport(query: SalesReportQueryDto) {
    const dateRange = this.getDateRange(query);
    return this.salesReportsService.generateSalesByEmployeeReport({
      ...query,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  }

  async getSalesByCustomerReport(query: SalesReportQueryDto) {
    const dateRange = this.getDateRange(query);
    return this.salesReportsService.generateSalesByCustomerReport({
      ...query,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  }

  async getCommissionReport(query: SalesReportQueryDto) {
    const dateRange = this.getDateRange(query);
    return this.salesReportsService.generateCommissionReport({
      ...query,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  }

  // Purchase Reports
  async getPurchaseReport(query: PurchaseReportQueryDto) {
    const dateRange = this.getDateRange(query);
    return this.purchaseReportsService.generatePurchaseReport({
      ...query,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  }

  async getPurchaseBySupplierReport(query: PurchaseReportQueryDto) {
    const dateRange = this.getDateRange(query);
    return this.purchaseReportsService.generatePurchaseBySupplierReport({
      ...query,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  }

  // Expense Reports
  async getExpenseReport(query: ExpenseReportQueryDto) {
    const dateRange = this.getDateRange(query);
    return this.expenseReportsService.generateExpenseReport({
      ...query,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  }

  async getExpenseByCategoryReport(query: ExpenseReportQueryDto) {
    const dateRange = this.getDateRange(query);
    return this.expenseReportsService.generateExpenseByCategoryReport({
      ...query,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  }

  // Employee Reports
  async getEmployeePerformanceReport(query: BaseReportQueryDto) {
    const dateRange = this.getDateRange(query);
    return this.employeeReportsService.generateEmployeePerformanceReport({
      ...query,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  }

  // Company Reports
  async getCompanyOverviewReport(query: BaseReportQueryDto) {
    const dateRange = this.getDateRange(query);
    return this.companyReportsService.generateCompanyOverviewReport({
      ...query,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  }

  async getProfitLossReport(query: BaseReportQueryDto) {
    const dateRange = this.getDateRange(query);
    return this.companyReportsService.generateProfitLossReport({
      ...query,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  }

  // Utility method to calculate date ranges
  private getDateRange(query: BaseReportQueryDto): { startDate: string; endDate: string } {
    if (query.startDate && query.endDate) {
      return { startDate: query.startDate, endDate: query.endDate };
    }

    const now = moment();
    let startDate: moment.Moment;
    let endDate: moment.Moment = now.clone();

    switch (query.period) {
      case ReportPeriod.TODAY:
        startDate = now.clone().startOf('day');
        endDate = now.clone().endOf('day');
        break;
      case ReportPeriod.YESTERDAY:
        startDate = now.clone().subtract(1, 'day').startOf('day');
        endDate = now.clone().subtract(1, 'day').endOf('day');
        break;
      case ReportPeriod.THIS_WEEK:
        startDate = now.clone().startOf('week');
        endDate = now.clone().endOf('week');
        break;
      case ReportPeriod.LAST_WEEK:
        startDate = now.clone().subtract(1, 'week').startOf('week');
        endDate = now.clone().subtract(1, 'week').endOf('week');
        break;
      case ReportPeriod.THIS_MONTH:
        startDate = now.clone().startOf('month');
        endDate = now.clone().endOf('month');
        break;
      case ReportPeriod.LAST_MONTH:
        startDate = now.clone().subtract(1, 'month').startOf('month');
        endDate = now.clone().subtract(1, 'month').endOf('month');
        break;
      case ReportPeriod.THIS_QUARTER:
        startDate = now.clone().startOf('quarter');
        endDate = now.clone().endOf('quarter');
        break;
      case ReportPeriod.LAST_QUARTER:
        startDate = now.clone().subtract(1, 'quarter').startOf('quarter');
        endDate = now.clone().subtract(1, 'quarter').endOf('quarter');
        break;
      case ReportPeriod.THIS_YEAR:
        startDate = now.clone().startOf('year');
        endDate = now.clone().endOf('year');
        break;
      case ReportPeriod.LAST_YEAR:
        startDate = now.clone().subtract(1, 'year').startOf('year');
        endDate = now.clone().subtract(1, 'year').endOf('year');
        break;
      default:
        // Default to current month
        startDate = now.clone().startOf('month');
        endDate = now.clone().endOf('month');
    }

    return {
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD')
    };
  }
}
