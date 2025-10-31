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
import { LocationService } from './location.service';

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
    private readonly locationService: LocationService,
  ) {
    super();
  }

  async create(createTransferDto: CreateTransferDto, user: User): Promise<TransferResponseDto> {
    // Validate locations and access
    const sourceLocation = await this.locationService.validateLocationAccess(
      createTransferDto.sourceLocationId,
      createTransferDto.sourceLocationType,
      user
    );
    
    const destinationLocation = await this.locationService.validateLocationAccess(
      createTransferDto.destinationLocationId,
      createTransferDto.destinationLocationType,
      user
    );

    // Validate inventory availability
    await this.validateInventoryAvailability(createTransferDto, sourceLocation);

    // Determine transfer type based on location types
    const transferType = this.determineTransferType(sourceLocation.type, destinationLocation.type);

    // Check if user is responsible for both locations (auto-approval)
    const isUserResponsibleForSource = await this.locationService.isUserResponsibleForLocation(
      createTransferDto.sourceLocationId,
      createTransferDto.sourceLocationType,
      user
    );
    
    const isUserResponsibleForDestination = await this.locationService.isUserResponsibleForLocation(
      createTransferDto.destinationLocationId,
      createTransferDto.destinationLocationType,
      user
    );

    const shouldAutoApprove = isUserResponsibleForSource && isUserResponsibleForDestination;

    // Create transfer
    const transfer = this.transferRepository.create({
      type: transferType,
      sourceLocationId: createTransferDto.sourceLocationId,
      sourceLocationType: createTransferDto.sourceLocationType,
      destinationLocationId: createTransferDto.destinationLocationId,
      destinationLocationType: createTransferDto.destinationLocationType,
      notes: createTransferDto.notes,
      expectedDate: createTransferDto.expectedDate,
      createdById: user.id,
      status: shouldAutoApprove ? TransferStatus.APPROVED : TransferStatus.REQUESTED,
      approvedById: shouldAutoApprove ? user.id : undefined,
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
    this.logger.log(`Transfer ${savedTransfer.transferNumber} created by user ${user.id}${shouldAutoApprove ? ' (auto-approved)' : ''}`);

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
      data: await Promise.all(transfers.map(transfer => this.mapToResponseDto(transfer))),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: User): Promise<TransferResponseDto> {
    const transfer = await this.transferRepository
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.createdBy', 'createdBy')
      .leftJoinAndSelect('transfer.approvedBy', 'approvedBy')
      .leftJoinAndSelect('transfer.deliveredBy', 'deliveredBy')
      .leftJoinAndSelect('transfer.acceptedBy', 'acceptedBy')
      .leftJoinAndSelect('transfer.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('transfer.id = :id', { id })
      .getOne();

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    // Check multi-tenant access
    if (!(await this.canAccessTransfer(transfer, user))) {
      throw new ForbiddenException('Access denied to this transfer');
    }

    return await this.mapToResponseDto(transfer);
  }

  async update(id: string, updateTransferDto: UpdateTransferDto, user: User): Promise<TransferResponseDto> {
    const transfer = await this.transferRepository
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.createdBy', 'createdBy')
      .leftJoinAndSelect('transfer.approvedBy', 'approvedBy')
      .leftJoinAndSelect('transfer.deliveredBy', 'deliveredBy')
      .leftJoinAndSelect('transfer.acceptedBy', 'acceptedBy')
      .leftJoinAndSelect('transfer.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('transfer.id = :id', { id })
      .getOne();

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    // Check multi-tenant access
    if (!(await this.canAccessTransfer(transfer, user))) {
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
    return this.update(id, { status: TransferStatus.APPROVED }, user);
  }

  async deliver(id: string, user: User): Promise<TransferResponseDto> {
    const transfer = await this.transferRepository.findOne({ where: { id } });
    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    if (![TransferStatus.APPROVED, TransferStatus.IN_TRANSIT].includes(transfer.status)) {
      throw new BadRequestException('Transfer cannot be delivered in current status');
    }

    transfer.status = TransferStatus.DELIVERED;
    transfer.deliveredDate = new Date();
    transfer.deliveredById = user.id;

    await this.transferRepository.save(transfer);
    this.logger.log(`Transfer ${transfer.transferNumber} marked as delivered by user ${user.id}`);

    return this.findOne(id, user);
  }

  async accept(id: string, user: User): Promise<TransferResponseDto> {
    const transfer = await this.transferRepository.findOne({ where: { id } });
    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    if (transfer.status !== TransferStatus.APPROVED && transfer.status !== TransferStatus.DELIVERED) {
      throw new BadRequestException('Transfer must be approved or delivered before it can be accepted');
    }

    // Process inventory movement
    await this.processInventoryMovement(transfer);

    transfer.status = TransferStatus.ACCEPTED;
    transfer.acceptedDate = new Date();
    transfer.acceptedById = user.id;

    await this.transferRepository.save(transfer);
    this.logger.log(`Transfer ${transfer.transferNumber} accepted by user ${user.id}`);

    return this.findOne(id, user);
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
      // Force external transfer for shop employees
      createTransferDto.type = TransferType.EXTERNAL;
      createTransferDto.sourceLocationId = user.shopId;
      createTransferDto.sourceLocationType = 'shop';
      createTransferDto.destinationLocationType = 'warehouse';
    } else {
      // For other roles, require type to be specified
      if (!createTransferDto.type) {
        throw new BadRequestException('Transfer type is required');
      }
    }
    
    return this.create(createTransferDto, user);
  }

  private determineTransferType(sourceType: 'warehouse' | 'shop', destinationType: 'warehouse' | 'shop'): TransferType {
    if (sourceType === destinationType) {
      return TransferType.INTERNAL;
    } else {
      return TransferType.EXTERNAL;
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

  private async validateInventoryAvailability(dto: CreateTransferDto, sourceLocation: any): Promise<void> {
    for (const item of dto.items) {
      const product = await this.productRepository.findOne({ where: { id: item.productId } });
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      let availableStock = 0;

      // Check source inventory based on location type
      if (sourceLocation.type === 'warehouse') {
        const warehouseProduct = await this.warehouseProductRepository
          .createQueryBuilder('wp')
          .innerJoin('wp.warehouse', 'w')
          .innerJoin('wp.product', 'p')
          .where('w.id = :warehouseId', { warehouseId: sourceLocation.id })
          .andWhere('p.id = :productId', { productId: item.productId })
          .getOne();
        availableStock = warehouseProduct?.stockQuantity || 0;
      } else if (sourceLocation.type === 'shop') {
        const shopProduct = await this.shopProductRepository
          .createQueryBuilder('sp')
          .innerJoin('sp.shop', 's')
          .innerJoin('sp.product', 'p')
          .where('s.id = :shopId', { shopId: sourceLocation.id })
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
      [TransferStatus.REQUESTED]: [TransferStatus.APPROVED, TransferStatus.REJECTED, TransferStatus.CANCELLED],
      [TransferStatus.APPROVED]: [TransferStatus.IN_TRANSIT, TransferStatus.CANCELLED],
      [TransferStatus.IN_TRANSIT]: [TransferStatus.DELIVERED, TransferStatus.CANCELLED],
      [TransferStatus.DELIVERED]: [TransferStatus.ACCEPTED, TransferStatus.CANCELLED],
      [TransferStatus.ACCEPTED]: [TransferStatus.COMPLETED],
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
    if (transfer.sourceLocationType === 'warehouse') {
      const warehouseProduct = await this.warehouseProductRepository
        .createQueryBuilder('wp')
        .innerJoin('wp.warehouse', 'w')
        .innerJoin('wp.product', 'p')
        .where('w.id = :warehouseId', { warehouseId: transfer.sourceLocationId })
        .andWhere('p.id = :productId', { productId: item.productId })
        .getOne();
      if (warehouseProduct) {
        warehouseProduct.stockQuantity = Math.max(0, warehouseProduct.stockQuantity - item.quantity);
        await this.warehouseProductRepository.save(warehouseProduct);
      }
    } else if (transfer.sourceLocationType === 'shop') {
      const shopProduct = await this.shopProductRepository
        .createQueryBuilder('sp')
        .innerJoin('sp.shop', 's')
        .innerJoin('sp.product', 'p')
        .where('s.id = :shopId', { shopId: transfer.sourceLocationId })
        .andWhere('p.id = :productId', { productId: item.productId })
        .getOne();
      if (shopProduct) {
        shopProduct.stockQuantity = Math.max(0, shopProduct.stockQuantity - item.quantity);
        await this.shopProductRepository.save(shopProduct);
      }
    }
  }

  private async increaseDestinationInventory(transfer: Transfer, item: TransferItem): Promise<void> {
    if (transfer.destinationLocationType === 'warehouse') {
      let warehouseProduct = await this.warehouseProductRepository
        .createQueryBuilder('wp')
        .innerJoin('wp.warehouse', 'w')
        .innerJoin('wp.product', 'p')
        .where('w.id = :warehouseId', { warehouseId: transfer.destinationLocationId })
        .andWhere('p.id = :productId', { productId: item.productId })
        .getOne();
      
      if (warehouseProduct) {
        warehouseProduct.stockQuantity += item.quantity;
      } else {
        warehouseProduct = this.warehouseProductRepository.create({
          warehouse: { id: transfer.destinationLocationId } as Warehouse,
          product: { id: item.productId } as Product,
          stockQuantity: item.quantity,
          minStockLevel: 0,
        });
      }
      await this.warehouseProductRepository.save(warehouseProduct);
    } else if (transfer.destinationLocationType === 'shop') {
      let shopProduct = await this.shopProductRepository
        .createQueryBuilder('sp')
        .innerJoin('sp.shop', 's')
        .innerJoin('sp.product', 'p')
        .where('s.id = :shopId', { shopId: transfer.destinationLocationId })
        .andWhere('p.id = :productId', { productId: item.productId })
        .getOne();
      
      if (shopProduct) {
        shopProduct.stockQuantity += item.quantity;
      } else {
        shopProduct = this.shopProductRepository.create({
          shop: { id: transfer.destinationLocationId } as Shop,
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
      .leftJoinAndSelect('transfer.createdBy', 'createdBy')
      .leftJoinAndSelect('transfer.approvedBy', 'approvedBy')
      .leftJoinAndSelect('transfer.deliveredBy', 'deliveredBy')
      .leftJoinAndSelect('transfer.acceptedBy', 'acceptedBy')
      .leftJoinAndSelect('transfer.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    // Note: Multi-tenant filtering is now handled in the service methods
    // since we need to check location company IDs dynamically
    return queryBuilder;
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<Transfer>, query: TransferQueryDto): void {
    if (query.type) {
      queryBuilder.andWhere('transfer.type = :type', { type: query.type });
    }

    if (query.status) {
      queryBuilder.andWhere('transfer.status = :status', { status: query.status });
    }

    if (query.sourceLocationId) {
      queryBuilder.andWhere('transfer.sourceLocationId = :sourceLocationId', { sourceLocationId: query.sourceLocationId });
    }

    if (query.destinationLocationId) {
      queryBuilder.andWhere('transfer.destinationLocationId = :destinationLocationId', { destinationLocationId: query.destinationLocationId });
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

  private async canAccessTransfer(transfer: Transfer, user: User): Promise<boolean> {
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Get company ID from either the loaded relation or the JWT payload
    const userCompanyId = user.company?.id || (user as any).companyId;
    if (!userCompanyId) {
      return false;
    }

    // Get location details to check company access
    const sourceLocation = await this.locationService.getLocationInfo(
      transfer.sourceLocationId, 
      transfer.sourceLocationType
    );
    const destinationLocation = await this.locationService.getLocationInfo(
      transfer.destinationLocationId, 
      transfer.destinationLocationType
    );

    return (
      sourceLocation?.companyId === userCompanyId ||
      destinationLocation?.companyId === userCompanyId
    );
  }

  private async mapToResponseDto(transfer: Transfer): Promise<TransferResponseDto> {
    // Get location details using the location service
    const sourceLocation = await this.locationService.getLocationInfo(
      transfer.sourceLocationId, 
      transfer.sourceLocationType
    );
    const destinationLocation = await this.locationService.getLocationInfo(
      transfer.destinationLocationId, 
      transfer.destinationLocationType
    );
    
    return {
      id: transfer.id,
      transferNumber: transfer.transferNumber,
      type: transfer.type,
      status: transfer.status,
      sourceLocationName: sourceLocation?.name,
      sourceLocationId: transfer.sourceLocationId,
      sourceLocationType: transfer.sourceLocationType,
      destinationLocationName: destinationLocation?.name,
      destinationLocationId: transfer.destinationLocationId,
      destinationLocationType: transfer.destinationLocationType,
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
      deliveredDate: transfer.deliveredDate,
      acceptedDate: transfer.acceptedDate,
      createdByName: `${transfer.createdBy.firstName} ${transfer.createdBy.lastName}`,
      createdById: transfer.createdById,
      approvedByName: transfer.approvedBy ? `${transfer.approvedBy.firstName} ${transfer.approvedBy.lastName}` : undefined,
      approvedById: transfer.approvedById,
      deliveredByName: transfer.deliveredBy ? `${transfer.deliveredBy.firstName} ${transfer.deliveredBy.lastName}` : undefined,
      deliveredById: transfer.deliveredById,
      acceptedByName: transfer.acceptedBy ? `${transfer.acceptedBy.firstName} ${transfer.acceptedBy.lastName}` : undefined,
      acceptedById: transfer.acceptedById,
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,
    };
  }
}