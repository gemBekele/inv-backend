import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Transfer } from '../entities/transfer.entity';
import { TransferItem } from '../entities/transfer-item.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { Shop } from '../../shops/entities/shops.entity';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { WarehouseProduct } from '../entities/warehouse-product.entity';
import { ShopProduct } from '../../shops/entities/shop-product.entity';
import { CreateTransferDto, UpdateTransferDto, TransferResponseDto, TransferQueryDto } from '../dto/transfer.dto';
import { TransferType, TransferStatus } from '../enums/transfer.enums';
import { UserRole } from '../../../common/enums';
import { BaseMultiTenantService } from '../../../common/services/base-multi-tenant.service';
import { PaginatedResult } from '../../../common/interfaces';

@Injectable()
export class TransferService extends BaseMultiTenantService {
  private readonly logger = new Logger(TransferService.name);

  constructor(
    @InjectRepository(Transfer)
    private readonly transferRepository: Repository<Transfer>,
    @InjectRepository(TransferItem)
    private readonly transferItemRepository: Repository<TransferItem>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(WarehouseProduct)
    private readonly warehouseProductRepository: Repository<WarehouseProduct>,
    @InjectRepository(ShopProduct)
    private readonly shopProductRepository: Repository<ShopProduct>,
  ) {
    super();
  }

  async create(createTransferDto: CreateTransferDto, user: User): Promise<TransferResponseDto> {
    // Validate transfer type and locations
    await this.validateTransferLocations(createTransferDto, user);

    // Validate inventory availability
    await this.validateInventoryAvailability(createTransferDto, user);

    // Create transfer
    const transfer = this.transferRepository.create({
      type: createTransferDto.type,
      sourceWarehouseId: createTransferDto.sourceWarehouseId,
      sourceShopId: createTransferDto.sourceShopId,
      destinationWarehouseId: createTransferDto.destinationWarehouseId,
      destinationShopId: createTransferDto.destinationShopId,
      notes: createTransferDto.notes,
      expectedDate: createTransferDto.expectedDate,
      createdById: user.id,
    });

    const savedTransfer = await this.transferRepository.save(transfer);

    // Create transfer items
    const transferItems: TransferItem[] = [];
    for (const itemDto of createTransferDto.items) {
      const transferItem = this.transferItemRepository.create({
        transferId: savedTransfer.id,
        productId: itemDto.productId,
        quantity: itemDto.quantity,
        notes: itemDto.notes,
      });
      transferItems.push(transferItem);
    }

    await this.transferItemRepository.save(transferItems);

    // Reload with relations
    const result = await this.findOne(savedTransfer.id, user);
    this.logger.log(`Transfer ${savedTransfer.transferNumber} created by user ${user.id}`);

    return result;
  }

  async findAll(query: TransferQueryDto, user: User): Promise<PaginatedResult<TransferResponseDto>> {
    const queryBuilder = this.createQueryBuilder(user);
    this.applyFilters(queryBuilder, query);

    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [transfers, total] = await queryBuilder.getManyAndCount();

    return {
      data: transfers.map(transfer => this.mapToResponseDto(transfer)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: User): Promise<TransferResponseDto> {
    const transfer = await this.transferRepository
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.sourceWarehouse', 'sourceWarehouse')
      .leftJoinAndSelect('sourceWarehouse.company', 'sourceWarehouseCompany')
      .leftJoinAndSelect('transfer.sourceShop', 'sourceShop')
      .leftJoinAndSelect('sourceShop.company', 'sourceShopCompany')
      .leftJoinAndSelect('transfer.destinationWarehouse', 'destinationWarehouse')
      .leftJoinAndSelect('destinationWarehouse.company', 'destinationWarehouseCompany')
      .leftJoinAndSelect('transfer.destinationShop', 'destinationShop')
      .leftJoinAndSelect('destinationShop.company', 'destinationShopCompany')
      .leftJoinAndSelect('transfer.createdBy', 'createdBy')
      .leftJoinAndSelect('transfer.approvedBy', 'approvedBy')
      .leftJoinAndSelect('transfer.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('transfer.id = :id', { id })
      .getOne();

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    // Check multi-tenant access
    if (!this.canAccessTransfer(transfer, user)) {
      throw new ForbiddenException('Access denied to this transfer');
    }

    return this.mapToResponseDto(transfer);
  }

  async update(id: string, updateTransferDto: UpdateTransferDto, user: User): Promise<TransferResponseDto> {
    const transfer = await this.transferRepository
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.sourceWarehouse', 'sourceWarehouse')
      .leftJoinAndSelect('sourceWarehouse.company', 'sourceWarehouseCompany')
      .leftJoinAndSelect('transfer.sourceShop', 'sourceShop')
      .leftJoinAndSelect('sourceShop.company', 'sourceShopCompany')
      .leftJoinAndSelect('transfer.destinationWarehouse', 'destinationWarehouse')
      .leftJoinAndSelect('destinationWarehouse.company', 'destinationWarehouseCompany')
      .leftJoinAndSelect('transfer.destinationShop', 'destinationShop')
      .leftJoinAndSelect('destinationShop.company', 'destinationShopCompany')
      .where('transfer.id = :id', { id })
      .getOne();

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    // Check multi-tenant access
    if (!this.canAccessTransfer(transfer, user)) {
      throw new ForbiddenException('Access denied to this transfer');
    }

    // Validate status transitions
    if (updateTransferDto.status) {
      this.validateStatusTransition(transfer.status, updateTransferDto.status);
    }

    // Update transfer
    if (updateTransferDto.status) {
      transfer.status = updateTransferDto.status;
      
      if (updateTransferDto.status === TransferStatus.COMPLETED) {
        transfer.completedDate = new Date();
        transfer.approvedById = user.id;
        // Process inventory movement
        await this.processInventoryMovement(transfer);
      } else if (updateTransferDto.status === TransferStatus.IN_TRANSIT) {
        transfer.approvedById = user.id;
      }
    }

    if (updateTransferDto.notes) {
      transfer.notes = updateTransferDto.notes;
    }

    if (updateTransferDto.rejectionReason) {
      transfer.rejectionReason = updateTransferDto.rejectionReason;
    }

    await this.transferRepository.save(transfer);

    this.logger.log(`Transfer ${transfer.transferNumber} updated by user ${user.id}`);
    return this.findOne(id, user);
  }

  async approve(id: string, user: User): Promise<TransferResponseDto> {
    return this.update(id, { status: TransferStatus.IN_TRANSIT }, user);
  }

  async complete(id: string, user: User): Promise<TransferResponseDto> {
    return this.update(id, { status: TransferStatus.COMPLETED }, user);
  }

  async cancel(id: string, user: User): Promise<TransferResponseDto> {
    return this.update(id, { status: TransferStatus.CANCELLED }, user);
  }

  async reject(id: string, rejectionReason: string, user: User): Promise<TransferResponseDto> {
    return this.update(id, { 
      status: TransferStatus.REJECTED, 
      rejectionReason 
    }, user);
  }

  async createRequest(createTransferDto: CreateTransferDto, user: User): Promise<TransferResponseDto> {
    // Shop employees can only request transfers from their shop to warehouse
    if (user.role === UserRole.SHOP_EMPLOYEE) {
      if (!user.shopId) {
        throw new BadRequestException('Shop employee must be assigned to a shop');
      }
      // Force shop-to-warehouse transfer for shop employees
      createTransferDto.type = TransferType.SHOP_TO_WAREHOUSE;
      createTransferDto.sourceShopId = user.shopId;
      createTransferDto.sourceWarehouseId = undefined;
    } else {
      // For other roles, require type to be specified
      if (!createTransferDto.type) {
        throw new BadRequestException('Transfer type is required');
      }
    }
    
    return this.create(createTransferDto, user);
  }

  private async validateTransferLocations(dto: CreateTransferDto, user: User): Promise<void> {
    const { type, sourceWarehouseId, sourceShopId, destinationWarehouseId, destinationShopId } = dto;

    // Validate source and destination based on transfer type
    switch (type) {
      case TransferType.WAREHOUSE_TO_WAREHOUSE:
        if (!sourceWarehouseId || !destinationWarehouseId) {
          throw new BadRequestException('Source and destination warehouses are required for warehouse-to-warehouse transfer');
        }
        if (sourceWarehouseId === destinationWarehouseId) {
          throw new BadRequestException('Source and destination warehouses cannot be the same');
        }
        await this.validateWarehouseAccess(sourceWarehouseId, user);
        await this.validateWarehouseAccess(destinationWarehouseId, user);
        break;

      case TransferType.WAREHOUSE_TO_SHOP:
        if (!sourceWarehouseId || !destinationShopId) {
          throw new BadRequestException('Source warehouse and destination shop are required');
        }
        await this.validateWarehouseAccess(sourceWarehouseId, user);
        await this.validateShopAccess(destinationShopId, user);
        break;

      case TransferType.SHOP_TO_WAREHOUSE:
        if (!sourceShopId || !destinationWarehouseId) {
          throw new BadRequestException('Source shop and destination warehouse are required');
        }
        await this.validateShopAccess(sourceShopId, user);
        await this.validateWarehouseAccess(destinationWarehouseId, user);
        break;

      case TransferType.SHOP_TO_SHOP:
        if (!sourceShopId || !destinationShopId) {
          throw new BadRequestException('Source and destination shops are required');
        }
        if (sourceShopId === destinationShopId) {
          throw new BadRequestException('Source and destination shops cannot be the same');
        }
        await this.validateShopAccess(sourceShopId, user);
        await this.validateShopAccess(destinationShopId, user);
        break;

      default:
        throw new BadRequestException('Invalid transfer type');
    }
  }

  private async validateWarehouseAccess(warehouseId: string, user: User): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id: warehouseId },
      relations: ['company']
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${warehouseId} not found`);
    }

    const userCompanyId = user.company?.id || (user as any).companyId;
    if (user.role !== UserRole.SUPER_ADMIN && warehouse.company?.id !== userCompanyId) {
      throw new ForbiddenException('Access denied to this warehouse');
    }

    return warehouse;
  }

  private async validateShopAccess(shopId: string, user: User): Promise<Shop> {
    const shop = await this.shopRepository.findOne({
      where: { id: shopId },
      relations: ['company']
    });

    if (!shop) {
      throw new NotFoundException(`Shop ${shopId} not found`);
    }

    const userCompanyId = user.company?.id || (user as any).companyId;
    if (user.role !== UserRole.SUPER_ADMIN && shop.company?.id !== userCompanyId) {
      throw new ForbiddenException('Access denied to this shop');
    }

    return shop;
  }

  private async validateInventoryAvailability(dto: CreateTransferDto, user: User): Promise<void> {
    for (const item of dto.items) {
      const product = await this.productRepository.findOne({ where: { id: item.productId } });
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      let availableStock = 0;

      // Check source inventory based on transfer type
      if (dto.sourceWarehouseId) {
        const warehouseProduct = await this.warehouseProductRepository
          .createQueryBuilder('wp')
          .innerJoin('wp.warehouse', 'w')
          .innerJoin('wp.product', 'p')
          .where('w.id = :warehouseId', { warehouseId: dto.sourceWarehouseId })
          .andWhere('p.id = :productId', { productId: item.productId })
          .getOne();
        availableStock = warehouseProduct?.stockQuantity || 0;
      } else if (dto.sourceShopId) {
        const shopProduct = await this.shopProductRepository
          .createQueryBuilder('sp')
          .innerJoin('sp.shop', 's')
          .innerJoin('sp.product', 'p')
          .where('s.id = :shopId', { shopId: dto.sourceShopId })
          .andWhere('p.id = :productId', { productId: item.productId })
          .getOne();
        availableStock = shopProduct?.stockQuantity || 0;
      }

      if (item.quantity > availableStock) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`
        );
      }
    }
  }

  private validateStatusTransition(currentStatus: TransferStatus, newStatus: TransferStatus): void {
    const validTransitions: Record<TransferStatus, TransferStatus[]> = {
      [TransferStatus.PENDING]: [TransferStatus.IN_TRANSIT, TransferStatus.REJECTED, TransferStatus.CANCELLED],
      [TransferStatus.IN_TRANSIT]: [TransferStatus.COMPLETED, TransferStatus.CANCELLED],
      [TransferStatus.COMPLETED]: [],
      [TransferStatus.CANCELLED]: [],
      [TransferStatus.REJECTED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private async processInventoryMovement(transfer: Transfer): Promise<void> {
    const items = await this.transferItemRepository.find({
      where: { transferId: transfer.id },
      relations: ['product']
    });

    for (const item of items) {
      // Decrease source inventory
      await this.decreaseSourceInventory(transfer, item);
      // Increase destination inventory
      await this.increaseDestinationInventory(transfer, item);
    }
  }

  private async decreaseSourceInventory(transfer: Transfer, item: TransferItem): Promise<void> {
    if (transfer.sourceWarehouseId) {
      const warehouseProduct = await this.warehouseProductRepository
        .createQueryBuilder('wp')
        .innerJoin('wp.warehouse', 'w')
        .innerJoin('wp.product', 'p')
        .where('w.id = :warehouseId', { warehouseId: transfer.sourceWarehouseId })
        .andWhere('p.id = :productId', { productId: item.productId })
        .getOne();
      if (warehouseProduct) {
        warehouseProduct.stockQuantity = Math.max(0, warehouseProduct.stockQuantity - item.quantity);
        await this.warehouseProductRepository.save(warehouseProduct);
      }
    } else if (transfer.sourceShopId) {
      const shopProduct = await this.shopProductRepository
        .createQueryBuilder('sp')
        .innerJoin('sp.shop', 's')
        .innerJoin('sp.product', 'p')
        .where('s.id = :shopId', { shopId: transfer.sourceShopId })
        .andWhere('p.id = :productId', { productId: item.productId })
        .getOne();
      if (shopProduct) {
        shopProduct.stockQuantity = Math.max(0, shopProduct.stockQuantity - item.quantity);
        await this.shopProductRepository.save(shopProduct);
      }
    }
  }

  private async increaseDestinationInventory(transfer: Transfer, item: TransferItem): Promise<void> {
    if (transfer.destinationWarehouseId) {
      let warehouseProduct = await this.warehouseProductRepository
        .createQueryBuilder('wp')
        .innerJoin('wp.warehouse', 'w')
        .innerJoin('wp.product', 'p')
        .where('w.id = :warehouseId', { warehouseId: transfer.destinationWarehouseId })
        .andWhere('p.id = :productId', { productId: item.productId })
        .getOne();
      
      if (warehouseProduct) {
        warehouseProduct.stockQuantity += item.quantity;
      } else {
        warehouseProduct = this.warehouseProductRepository.create({
          warehouse: { id: transfer.destinationWarehouseId } as Warehouse,
          product: { id: item.productId } as Product,
          stockQuantity: item.quantity,
          minStockLevel: 0,
        });
      }
      await this.warehouseProductRepository.save(warehouseProduct);
    } else if (transfer.destinationShopId) {
      let shopProduct = await this.shopProductRepository
        .createQueryBuilder('sp')
        .innerJoin('sp.shop', 's')
        .innerJoin('sp.product', 'p')
        .where('s.id = :shopId', { shopId: transfer.destinationShopId })
        .andWhere('p.id = :productId', { productId: item.productId })
        .getOne();
      
      if (shopProduct) {
        shopProduct.stockQuantity += item.quantity;
      } else {
        shopProduct = this.shopProductRepository.create({
          shop: { id: transfer.destinationShopId } as Shop,
          product: { id: item.productId } as Product,
          stockQuantity: item.quantity,
          minStockLevel: 0,
        });
      }
      await this.shopProductRepository.save(shopProduct);
    }
  }

  private createQueryBuilder(user: User): SelectQueryBuilder<Transfer> {
    const queryBuilder = this.transferRepository.createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.sourceWarehouse', 'sourceWarehouse')
      .leftJoinAndSelect('transfer.sourceShop', 'sourceShop')
      .leftJoinAndSelect('transfer.destinationWarehouse', 'destinationWarehouse')
      .leftJoinAndSelect('transfer.destinationShop', 'destinationShop')
      .leftJoinAndSelect('transfer.createdBy', 'createdBy')
      .leftJoinAndSelect('transfer.approvedBy', 'approvedBy')
      .leftJoinAndSelect('transfer.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    // Apply multi-tenant filtering
    const userCompanyId = user.company?.id || (user as any).companyId;
    if (user.role !== UserRole.SUPER_ADMIN && userCompanyId) {
      queryBuilder.where(
        '(sourceWarehouse.companyId = :companyId OR sourceShop.companyId = :companyId OR destinationWarehouse.companyId = :companyId OR destinationShop.companyId = :companyId)',
        { companyId: userCompanyId }
      );
    }

    return queryBuilder;
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<Transfer>, query: TransferQueryDto): void {
    if (query.type) {
      queryBuilder.andWhere('transfer.type = :type', { type: query.type });
    }

    if (query.status) {
      queryBuilder.andWhere('transfer.status = :status', { status: query.status });
    }

    if (query.sourceWarehouseId) {
      queryBuilder.andWhere('transfer.sourceWarehouseId = :sourceWarehouseId', { sourceWarehouseId: query.sourceWarehouseId });
    }

    if (query.destinationWarehouseId) {
      queryBuilder.andWhere('transfer.destinationWarehouseId = :destinationWarehouseId', { destinationWarehouseId: query.destinationWarehouseId });
    }

    if (query.sourceShopId) {
      queryBuilder.andWhere('transfer.sourceShopId = :sourceShopId', { sourceShopId: query.sourceShopId });
    }

    if (query.destinationShopId) {
      queryBuilder.andWhere('transfer.destinationShopId = :destinationShopId', { destinationShopId: query.destinationShopId });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(transfer.transferNumber ILIKE :search OR transfer.notes ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.createdFrom) {
      queryBuilder.andWhere('transfer.createdAt >= :createdFrom', { createdFrom: query.createdFrom });
    }

    if (query.createdTo) {
      queryBuilder.andWhere('transfer.createdAt <= :createdTo', { createdTo: query.createdTo });
    }

    queryBuilder.orderBy('transfer.createdAt', 'DESC');
  }

  private canAccessTransfer(transfer: Transfer, user: User): boolean {
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Get company ID from either the loaded relation or the JWT payload
    const userCompanyId = user.company?.id || (user as any).companyId;
    if (!userCompanyId) {
      return false;
    }

    return (
      transfer.sourceWarehouse?.company?.id === userCompanyId ||
      transfer.sourceShop?.company?.id === userCompanyId ||
      transfer.destinationWarehouse?.company?.id === userCompanyId ||
      transfer.destinationShop?.company?.id === userCompanyId
    );
  }

  private mapToResponseDto(transfer: Transfer): TransferResponseDto {
    return {
      id: transfer.id,
      transferNumber: transfer.transferNumber,
      type: transfer.type,
      status: transfer.status,
      sourceWarehouseName: transfer.sourceWarehouse?.name,
      sourceWarehouseId: transfer.sourceWarehouseId,
      sourceShopName: transfer.sourceShop?.name,
      sourceShopId: transfer.sourceShopId,
      destinationWarehouseName: transfer.destinationWarehouse?.name,
      destinationWarehouseId: transfer.destinationWarehouseId,
      destinationShopName: transfer.destinationShop?.name,
      destinationShopId: transfer.destinationShopId,
      items: transfer.items?.map(item => ({
        id: item.id,
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        notes: item.notes,
      })) || [],
      notes: transfer.notes,
      rejectionReason: transfer.rejectionReason,
      expectedDate: transfer.expectedDate,
      completedDate: transfer.completedDate,
      createdByName: `${transfer.createdBy.firstName} ${transfer.createdBy.lastName}`,
      createdById: transfer.createdById,
      approvedByName: transfer.approvedBy ? `${transfer.approvedBy.firstName} ${transfer.approvedBy.lastName}` : undefined,
      approvedById: transfer.approvedById,
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,
    };
  }
}