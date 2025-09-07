import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { WarehouseProduct } from '../../warehouse/entities/warehouse-product.entity';
import { InventoryReportQueryDto, InventoryReportDto, InventoryReportItemDto, ReportMetadata } from '../dto/report.dto';

@Injectable()
export class InventoryReportsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(WarehouseProduct)
    private readonly warehouseProductRepository: Repository<WarehouseProduct>,
  ) {}

  async generateInventoryReport(query: InventoryReportQueryDto): Promise<InventoryReportDto> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.warehouseProducts', 'warehouseProduct')
      .leftJoinAndSelect('warehouseProduct.warehouse', 'warehouse')
      .leftJoinAndSelect('product.company', 'company');

    // Apply filters
    if (query.companyId) {
      queryBuilder.andWhere('product.companyId = :companyId', { companyId: query.companyId });
    }

    if (query.category) {
      queryBuilder.andWhere('product.category ILIKE :category', { category: `%${query.category}%` });
    }

    if (query.warehouseId) {
      queryBuilder.andWhere('warehouse.id = :warehouseId', { warehouseId: query.warehouseId });
    }

    if (query.lowStockOnly) {
      queryBuilder.andWhere('product.stockQuantity <= product.minStockLevel');
    }

    if (query.includeExpired === false) {
      queryBuilder.andWhere('(product.expiryDate IS NULL OR product.expiryDate > :currentDate)', { 
        currentDate: new Date() 
      });
    }

    const products = await queryBuilder.getMany();

    const items: InventoryReportItemDto[] = products.map(product => ({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      stockQuantity: product.stockQuantity,
      minStockLevel: product.minStockLevel,
      stockValue: product.stockQuantity * product.cost,
      warehouseName: product.warehouseProducts?.[0]?.warehouse?.name,
      isLowStock: product.stockQuantity <= product.minStockLevel,
      isExpired: product.calculatedIsExpired,
      lastUpdated: product.updatedAt,
    }));

    const summary = {
      totalProducts: items.length,
      totalStockValue: items.reduce((sum, item) => sum + item.stockValue, 0),
      lowStockItems: items.filter(item => item.isLowStock).length,
      expiredItems: items.filter(item => item.isExpired).length,
      totalWarehouses: new Set(items.map(item => item.warehouseName)).size,
    };

    const metadata: ReportMetadata = {
      generatedAt: new Date(),
      periodStart: new Date(query.startDate || new Date()),
      periodEnd: new Date(query.endDate || new Date()),
      totalRecords: items.length,
      filters: this.extractFilters(query),
    };

    return { metadata, items, summary };
  }

  async generateStockValuationReport(query: InventoryReportQueryDto) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .select([
        'product.id',
        'product.name',
        'product.sku',
        'product.category',
        'product.stockQuantity',
        'product.cost',
        'product.price',
        '(product.stockQuantity * product.cost) as totalCostValue',
        '(product.stockQuantity * product.price) as totalRetailValue',
        '((product.stockQuantity * product.price) - (product.stockQuantity * product.cost)) as potentialProfit'
      ])
      .where('product.stockQuantity > 0');

    if (query.companyId) {
      queryBuilder.andWhere('product.companyId = :companyId', { companyId: query.companyId });
    }

    if (query.category) {
      queryBuilder.andWhere('product.category ILIKE :category', { category: `%${query.category}%` });
    }

    const results = await queryBuilder.getRawMany();

    const totalCostValue = results.reduce((sum, item) => sum + parseFloat(item.totalCostValue), 0);
    const totalRetailValue = results.reduce((sum, item) => sum + parseFloat(item.totalRetailValue), 0);
    const totalPotentialProfit = results.reduce((sum, item) => sum + parseFloat(item.potentialProfit), 0);

    return {
      metadata: {
        generatedAt: new Date(),
        periodStart: new Date(query.startDate || new Date()),
        periodEnd: new Date(query.endDate || new Date()),
        totalRecords: results.length,
        filters: this.extractFilters(query),
      },
      items: results,
      summary: {
        totalCostValue,
        totalRetailValue,
        totalPotentialProfit,
        profitMarginPercentage: totalCostValue > 0 ? (totalPotentialProfit / totalCostValue) * 100 : 0,
      }
    };
  }

  async generateLowStockReport(query: InventoryReportQueryDto) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.warehouseProducts', 'warehouseProduct')
      .leftJoinAndSelect('warehouseProduct.warehouse', 'warehouse')
      .where('product.stockQuantity <= product.minStockLevel')
      .andWhere('product.trackStock = true');

    if (query.companyId) {
      queryBuilder.andWhere('product.companyId = :companyId', { companyId: query.companyId });
    }

    if (query.warehouseId) {
      queryBuilder.andWhere('warehouse.id = :warehouseId', { warehouseId: query.warehouseId });
    }

    const products = await queryBuilder.getMany();

    const items = products.map(product => ({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      currentStock: product.stockQuantity,
      minStockLevel: product.minStockLevel,
      shortage: product.minStockLevel - product.stockQuantity,
      warehouseName: product.warehouseProducts?.[0]?.warehouse?.name,
      urgencyLevel: product.stockQuantity === 0 ? 'CRITICAL' : 
                   product.stockQuantity < product.minStockLevel * 0.5 ? 'HIGH' : 'MEDIUM',
      lastUpdated: product.updatedAt,
    }));

    return {
      metadata: {
        generatedAt: new Date(),
        totalRecords: items.length,
        filters: this.extractFilters(query),
      },
      items,
      summary: {
        totalLowStockItems: items.length,
        criticalItems: items.filter(item => item.urgencyLevel === 'CRITICAL').length,
        highPriorityItems: items.filter(item => item.urgencyLevel === 'HIGH').length,
        mediumPriorityItems: items.filter(item => item.urgencyLevel === 'MEDIUM').length,
      }
    };
  }

  async generateExpiredProductsReport(query: InventoryReportQueryDto) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.warehouseProducts', 'warehouseProduct')
      .leftJoinAndSelect('warehouseProduct.warehouse', 'warehouse')
      .where('product.expiryDate < :currentDate', { currentDate: new Date() })
      .andWhere('product.stockQuantity > 0');

    if (query.companyId) {
      queryBuilder.andWhere('product.companyId = :companyId', { companyId: query.companyId });
    }

    const products = await queryBuilder.getMany();

    const items = products.map(product => ({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      stockQuantity: product.stockQuantity,
      expiryDate: product.expiryDate,
      daysExpired: Math.floor((new Date().getTime() - product.expiryDate.getTime()) / (1000 * 60 * 60 * 24)),
      stockValue: product.stockQuantity * product.cost,
      warehouseName: product.warehouseProducts?.[0]?.warehouse?.name,
    }));

    return {
      metadata: {
        generatedAt: new Date(),
        totalRecords: items.length,
        filters: this.extractFilters(query),
      },
      items,
      summary: {
        totalExpiredProducts: items.length,
        totalExpiredValue: items.reduce((sum, item) => sum + item.stockValue, 0),
        totalExpiredQuantity: items.reduce((sum, item) => sum + item.stockQuantity, 0),
      }
    };
  }

  async generateInventoryMovementReport(query: InventoryReportQueryDto) {
    // This would typically involve tracking inventory movements through sales, purchases, adjustments
    // For now, return a basic structure that can be enhanced with actual movement tracking
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.warehouseProducts', 'warehouseProduct')
      .leftJoinAndSelect('warehouseProduct.warehouse', 'warehouse')
      .where('product.updatedAt BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate
      });

    if (query.companyId) {
      queryBuilder.andWhere('product.companyId = :companyId', { companyId: query.companyId });
    }

    const products = await queryBuilder.getMany();

    return {
      metadata: {
        generatedAt: new Date(),
        periodStart: new Date(query.startDate),
        periodEnd: new Date(query.endDate),
        totalRecords: products.length,
        filters: this.extractFilters(query),
      },
      items: products.map(product => ({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentStock: product.stockQuantity,
        lastMovementDate: product.updatedAt,
        warehouseName: product.warehouseProducts?.[0]?.warehouse?.name,
      })),
      summary: {
        totalProductsWithMovement: products.length,
      }
    };
  }

  private extractFilters(query: InventoryReportQueryDto): Record<string, any> {
    const filters: Record<string, any> = {};
    
    if (query.companyId) filters.companyId = query.companyId;
    if (query.warehouseId) filters.warehouseId = query.warehouseId;
    if (query.category) filters.category = query.category;
    if (query.lowStockOnly) filters.lowStockOnly = query.lowStockOnly;
    if (query.includeExpired !== undefined) filters.includeExpired = query.includeExpired;
    if (query.startDate) filters.startDate = query.startDate;
    if (query.endDate) filters.endDate = query.endDate;

    return filters;
  }
}
