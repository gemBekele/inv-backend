import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sales } from '../../sales/entities/sales.entity';
import { SaleItem } from '../../sales/entities/sales-item.entity';
import { Commission } from '../../commission/entities/commission.entity';
import { SalesReportQueryDto, SalesReportDto, SalesReportItemDto, ReportMetadata } from '../dto/report.dto';

@Injectable()
export class SalesReportsService {
  constructor(
    @InjectRepository(Sales)
    private readonly salesRepository: Repository<Sales>,
    @InjectRepository(SaleItem)
    private readonly salesItemRepository: Repository<SaleItem>,
    @InjectRepository(Commission)
    private readonly commissionRepository: Repository<Commission>,
  ) {}

  async generateSalesReport(query: SalesReportQueryDto): Promise<SalesReportDto> {
    const queryBuilder = this.salesRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.customer', 'customer')
      .leftJoinAndSelect('sale.createdBy', 'createdBy')
      .leftJoinAndSelect('sale.shop', 'shop')
      .leftJoinAndSelect('shop.company', 'shopCompany')
      .leftJoinAndSelect('sale.warehouse', 'warehouse')
      .leftJoinAndSelect('warehouse.company', 'warehouseCompany')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate
      });

    // Apply filters
    if (query.companyId) {
      queryBuilder.andWhere('(warehouseCompany.id = :companyId OR shopCompany.id = :companyId)', { 
        companyId: query.companyId 
      });
    }

    if (query.shopId) {
      queryBuilder.andWhere('sale.shop_id = :shopId', { shopId: query.shopId });
    }

    if (query.branchId) {
      queryBuilder.andWhere('sale.branch_id = :branchId', { branchId: query.branchId });
    }

    if (query.employeeId) {
      queryBuilder.andWhere('sale.created_by = :employeeId', { employeeId: query.employeeId });
    }

    if (query.customerId) {
      queryBuilder.andWhere('customer.id = :customerId', { customerId: query.customerId });
    }

    const sales = await queryBuilder.getMany();

    const items: SalesReportItemDto[] = sales.map(sale => ({
      saleId: sale.id,
      saleDate: sale.createdAt,
      customerName: sale.customer?.name || 'Walk-in Customer',
      employeeName: sale.createdBy?.fullName || 'Unknown',
      shopName: sale.shop?.name,
      warehouseName: sale.warehouse?.name,
      totalAmount: sale.totalAmount,
      taxAmount: sale.taxAmount,
      commissionAmount: 0, // Will be calculated if needed
      itemCount: sale.items?.length || 0,
      paymentMethod: sale.paymentType || 'Unknown',
    }));

    const summary = {
      totalSales: items.length,
      totalRevenue: items.reduce((sum, item) => sum + item.totalAmount, 0),
      totalTax: items.reduce((sum, item) => sum + item.taxAmount, 0),
      totalCommission: items.reduce((sum, item) => sum + item.commissionAmount, 0),
      averageSaleAmount: items.length > 0 ? items.reduce((sum, item) => sum + item.totalAmount, 0) / items.length : 0,
      totalCustomers: new Set(items.filter(item => item.customerName !== 'Walk-in Customer').map(item => item.customerName)).size,
    };

    const metadata: ReportMetadata = {
      generatedAt: new Date(),
      periodStart: new Date(query.startDate),
      periodEnd: new Date(query.endDate),
      totalRecords: items.length,
      filters: this.extractFilters(query),
    };

    return { metadata, items, summary };
  }

  async generateSalesByProductReport(query: SalesReportQueryDto) {
    const queryBuilder = this.salesItemRepository
      .createQueryBuilder('salesItem')
      .leftJoinAndSelect('salesItem.product', 'product')
      .leftJoinAndSelect('salesItem.sale', 'sale')
      .leftJoinAndSelect('sale.shop', 'shop')
      .leftJoinAndSelect('sale.branch', 'branch')
      .where('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate
      });

    if (query.companyId) {
      queryBuilder.andWhere('shop.companyId = :companyId OR branch.companyId = :companyId', { 
        companyId: query.companyId 
      });
    }

    if (query.productId) {
      queryBuilder.andWhere('product.id = :productId', { productId: query.productId });
    }

    const salesItems = await queryBuilder.getMany();

    // Group by product
    const productSales = salesItems.reduce((acc, item) => {
      const productId = item.product.id;
      if (!acc[productId]) {
        acc[productId] = {
          productId,
          productName: item.product.name,
          sku: item.product.sku,
          category: item.product.category,
          totalQuantitySold: 0,
          totalRevenue: 0,
          totalSales: 0,
          averagePrice: 0,
        };
      }
      acc[productId].totalQuantitySold += item.quantity;
      acc[productId].totalRevenue += item.total;
      acc[productId].totalSales += 1;
      return acc;
    }, {});

    const items = Object.values(productSales).map((item: any) => ({
      ...item,
      averagePrice: item.totalRevenue / item.totalQuantitySold,
    }));

    return {
      metadata: {
        generatedAt: new Date(),
        periodStart: new Date(query.startDate),
        periodEnd: new Date(query.endDate),
        totalRecords: items.length,
        filters: this.extractFilters(query),
      },
      items,
      summary: {
        totalProductsSold: items.length,
        totalQuantity: items.reduce((sum, item) => sum + item.totalQuantitySold, 0),
        totalRevenue: items.reduce((sum, item) => sum + item.totalRevenue, 0),
      }
    };
  }

  async generateSalesByEmployeeReport(query: SalesReportQueryDto) {
    const queryBuilder = this.salesRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.createdBy', 'createdBy')
      .leftJoinAndSelect('sale.shop', 'shop')
      .leftJoinAndSelect('sale.branch', 'branch')
      .where('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate
      });

    if (query.companyId) {
      queryBuilder.andWhere('shop.companyId = :companyId OR branch.companyId = :companyId', { 
        companyId: query.companyId 
      });
    }

    if (query.employeeId) {
      queryBuilder.andWhere('sale.created_by = :employeeId', { employeeId: query.employeeId });
    }

    const sales = await queryBuilder.getMany();

    // Group by employee (using createdBy user)
    const employeeSales = sales.reduce((acc, sale) => {
      const employeeId = sale.createdBy?.id || 'unknown';
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employeeId,
          employeeName: sale.createdBy?.fullName || 'Unknown',
          totalSales: 0,
          totalRevenue: 0,
          averageSaleAmount: 0,
        };
      }
      acc[employeeId].totalSales += 1;
      acc[employeeId].totalRevenue += sale.totalAmount;
      return acc;
    }, {});

    const items = Object.values(employeeSales).map((item: any) => ({
      ...item,
      averageSaleAmount: item.totalRevenue / item.totalSales,
    }));

    return {
      metadata: {
        generatedAt: new Date(),
        periodStart: new Date(query.startDate),
        periodEnd: new Date(query.endDate),
        totalRecords: items.length,
        filters: this.extractFilters(query),
      },
      items,
      summary: {
        totalEmployees: items.length,
        totalSales: items.reduce((sum, item) => sum + item.totalSales, 0),
        totalRevenue: items.reduce((sum, item) => sum + item.totalRevenue, 0),
      }
    };
  }

  async generateSalesByCustomerReport(query: SalesReportQueryDto) {
    const queryBuilder = this.salesRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.customer', 'customer')
      .leftJoinAndSelect('sale.shop', 'shop')
      .leftJoinAndSelect('sale.branch', 'branch')
      .where('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate
      })
      .andWhere('customer.id IS NOT NULL');

    if (query.companyId) {
      queryBuilder.andWhere('shop.companyId = :companyId OR branch.companyId = :companyId', { 
        companyId: query.companyId 
      });
    }

    if (query.customerId) {
      queryBuilder.andWhere('customer.id = :customerId', { customerId: query.customerId });
    }

    const sales = await queryBuilder.getMany();

    // Group by customer
    const customerSales = sales.reduce((acc, sale) => {
      const customerId = sale.customer.id;
      if (!acc[customerId]) {
        acc[customerId] = {
          customerId,
          customerName: sale.customer.name,
          customerPhone: sale.customer.phoneNumber,
          totalSales: 0,
          totalRevenue: 0,
          lastPurchaseDate: sale.createdAt,
        };
      }
      acc[customerId].totalSales += 1;
      acc[customerId].totalRevenue += sale.totalAmount;
      if (sale.createdAt > acc[customerId].lastPurchaseDate) {
        acc[customerId].lastPurchaseDate = sale.createdAt;
      }
      return acc;
    }, {});

    return {
      metadata: {
        generatedAt: new Date(),
        periodStart: new Date(query.startDate),
        periodEnd: new Date(query.endDate),
        totalRecords: Object.keys(customerSales).length,
        filters: this.extractFilters(query),
      },
      items: Object.values(customerSales),
      summary: {
        totalCustomers: Object.keys(customerSales).length,
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      }
    };
  }

  async generateCommissionReport(query: SalesReportQueryDto) {
    const queryBuilder = this.commissionRepository
      .createQueryBuilder('commission')
      .leftJoinAndSelect('commission.employee', 'employee')
      .leftJoinAndSelect('commission.product', 'product')
      .leftJoinAndSelect('commission.sale', 'sale')
      .where('commission.createdAt BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate
      });

    if (query.employeeId) {
      queryBuilder.andWhere('commission.employeeId = :employeeId', { employeeId: query.employeeId });
    }

    const commissions = await queryBuilder.getMany();

    const items = commissions.map(commission => ({
      commissionId: commission.id,
      employeeName: commission.employee?.name,
      productName: commission.product?.name,
      saleId: commission.sale?.id,
      commissionAmount: commission.commissionAmount,
      commissionRate: commission.commissionRate,
      saleAmount: commission.amount, // Use 'amount' field from Commission entity
      date: commission.createdAt,
      status: commission.isApproved ? 'Approved' : 'Pending', // Map boolean to string status
    }));

    return {
      metadata: {
        generatedAt: new Date(),
        periodStart: new Date(query.startDate),
        periodEnd: new Date(query.endDate),
        totalRecords: items.length,
        filters: this.extractFilters(query),
      },
      items,
      summary: {
        totalCommissions: items.length,
        totalCommissionAmount: items.reduce((sum, item) => sum + item.commissionAmount, 0),
        totalSalesAmount: items.reduce((sum, item) => sum + item.saleAmount, 0),
        averageCommissionRate: items.length > 0 ? 
          items.reduce((sum, item) => sum + item.commissionRate, 0) / items.length : 0,
      }
    };
  }

  private extractFilters(query: SalesReportQueryDto): Record<string, any> {
    const filters: Record<string, any> = {};
    
    if (query.companyId) filters.companyId = query.companyId;
    if (query.shopId) filters.shopId = query.shopId;
    if (query.branchId) filters.branchId = query.branchId;
    if (query.employeeId) filters.employeeId = query.employeeId;
    if (query.customerId) filters.customerId = query.customerId;
    if (query.productId) filters.productId = query.productId;
    if (query.includeCommission) filters.includeCommission = query.includeCommission;
    if (query.startDate) filters.startDate = query.startDate;
    if (query.endDate) filters.endDate = query.endDate;

    return filters;
  }
}
