import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsUUID, IsEnum, IsArray, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  EXCEL = 'xlsx'
}

export enum ReportPeriod {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_QUARTER = 'this_quarter',
  LAST_QUARTER = 'last_quarter',
  THIS_YEAR = 'this_year',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom'
}

export enum GroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  PRODUCT = 'product',
  CATEGORY = 'category',
  WAREHOUSE = 'warehouse',
  SHOP = 'shop',
  BRANCH = 'branch',
  EMPLOYEE = 'employee',
  CUSTOMER = 'customer',
  SUPPLIER = 'supplier'
}

export class BaseReportQueryDto {
  @ApiPropertyOptional({ description: 'Start date for report', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for report', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Predefined period', enum: ReportPeriod })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;

  @ApiPropertyOptional({ description: 'Company ID filter' })
  @IsOptional()
  @IsUUID('4')
  companyId?: string;

  @ApiPropertyOptional({ description: 'Report format', enum: ReportFormat, default: ReportFormat.JSON })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat = ReportFormat.JSON;

  @ApiPropertyOptional({ description: 'Group results by', enum: GroupBy })
  @IsOptional()
  @IsEnum(GroupBy)
  groupBy?: GroupBy;
}

export class InventoryReportQueryDto extends BaseReportQueryDto {
  @ApiPropertyOptional({ description: 'Warehouse ID filter' })
  @IsOptional()
  @IsUUID('4')
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Product category filter' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Include only low stock items' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  lowStockOnly?: boolean;

  @ApiPropertyOptional({ description: 'Include expired items' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeExpired?: boolean;
}

export class SalesReportQueryDto extends BaseReportQueryDto {
  @ApiPropertyOptional({ description: 'Shop ID filter' })
  @IsOptional()
  @IsUUID('4')
  shopId?: string;

  @ApiPropertyOptional({ description: 'Branch ID filter' })
  @IsOptional()
  @IsUUID('4')
  branchId?: string;

  @ApiPropertyOptional({ description: 'Employee ID filter' })
  @IsOptional()
  @IsUUID('4')
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Customer ID filter' })
  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  @ApiPropertyOptional({ description: 'Product ID filter' })
  @IsOptional()
  @IsUUID('4')
  productId?: string;

  @ApiPropertyOptional({ description: 'Include commission details' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeCommission?: boolean;
}

export class ExpenseReportQueryDto extends BaseReportQueryDto {
  @ApiPropertyOptional({ description: 'Expense category filter' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Employee ID filter' })
  @IsOptional()
  @IsUUID('4')
  employeeId?: string;
}

export class PurchaseReportQueryDto extends BaseReportQueryDto {
  @ApiPropertyOptional({ description: 'Supplier ID filter' })
  @IsOptional()
  @IsUUID('4')
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Warehouse ID filter' })
  @IsOptional()
  @IsUUID('4')
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Product ID filter' })
  @IsOptional()
  @IsUUID('4')
  productId?: string;
}

// Response DTOs
export class ReportMetadata {
  @ApiProperty({ description: 'Report generation date' })
  generatedAt: Date;

  @ApiProperty({ description: 'Report period start' })
  periodStart: Date;

  @ApiProperty({ description: 'Report period end' })
  periodEnd: Date;

  @ApiProperty({ description: 'Total records' })
  totalRecords: number;

  @ApiProperty({ description: 'Applied filters' })
  filters: Record<string, any>;
}

export class InventoryReportItemDto {
  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Product name' })
  productName: string;

  @ApiProperty({ description: 'SKU' })
  sku: string;

  @ApiProperty({ description: 'Category' })
  category: string;

  @ApiProperty({ description: 'Current stock quantity' })
  stockQuantity: number;

  @ApiProperty({ description: 'Minimum stock level' })
  minStockLevel: number;

  @ApiProperty({ description: 'Stock value' })
  stockValue: number;

  @ApiProperty({ description: 'Warehouse name' })
  warehouseName?: string;

  @ApiProperty({ description: 'Is low stock' })
  isLowStock: boolean;

  @ApiProperty({ description: 'Is expired' })
  isExpired: boolean;

  @ApiProperty({ description: 'Last updated' })
  lastUpdated: Date;
}

export class SalesReportItemDto {
  @ApiProperty({ description: 'Sale ID' })
  saleId: string;

  @ApiProperty({ description: 'Sale date' })
  saleDate: Date;

  @ApiProperty({ description: 'Customer name' })
  customerName?: string;

  @ApiProperty({ description: 'Employee name' })
  employeeName?: string;

  @ApiProperty({ description: 'Shop name' })
  shopName?: string;

  @ApiProperty({ description: 'Branch name' })
  branchName?: string;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Tax amount' })
  taxAmount: number;

  @ApiProperty({ description: 'Commission amount' })
  commissionAmount?: number;

  @ApiProperty({ description: 'Number of items' })
  itemCount: number;

  @ApiProperty({ description: 'Payment method' })
  paymentMethod: string;
}

export class InventoryReportDto {
  @ApiProperty({ description: 'Report metadata', type: ReportMetadata })
  metadata: ReportMetadata;

  @ApiProperty({ description: 'Inventory items', type: [InventoryReportItemDto] })
  items: InventoryReportItemDto[];

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalProducts: number;
    totalStockValue: number;
    lowStockItems: number;
    expiredItems: number;
    totalWarehouses: number;
  };
}

export class SalesReportDto {
  @ApiProperty({ description: 'Report metadata', type: ReportMetadata })
  metadata: ReportMetadata;

  @ApiProperty({ description: 'Sales items', type: [SalesReportItemDto] })
  items: SalesReportItemDto[];

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalTax: number;
    totalCommission: number;
    averageSaleAmount: number;
    totalCustomers: number;
  };
}
