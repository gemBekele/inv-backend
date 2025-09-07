import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto, UpdateSupplierDto, SupplierQueryDto, SupplierResponseDto } from './dto/supplier.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { SupplierStatus } from './enums/supplier-status.enum';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<SupplierResponseDto> {
    // Check if supplier name already exists within the same company
    const existingByName = await this.supplierRepository.findOne({
      where: { 
        name: createSupplierDto.name,
        companyId: createSupplierDto.companyId 
      }
    });

    if (existingByName) {
      throw new ConflictException('Supplier with this name already exists in the company');
    }

    // Check if email already exists within the same company (if provided)
    if (createSupplierDto.email) {
      const existingByEmail = await this.supplierRepository.findOne({
        where: { 
          email: createSupplierDto.email,
          companyId: createSupplierDto.companyId 
        }
      });

      if (existingByEmail) {
        throw new ConflictException('Supplier with this email already exists in the company');
      }
    }

    const supplier = this.supplierRepository.create(createSupplierDto);
    const savedSupplier = await this.supplierRepository.save(supplier);
    
    return this.mapToResponseDto(savedSupplier);
  }

  async findAll(query: SupplierQueryDto): Promise<PaginatedResult<SupplierResponseDto>> {
    const { page = 1, limit = 10, search, status, companyId, activeOnly } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.supplierRepository
      .createQueryBuilder('supplier')
      .leftJoinAndSelect('supplier.company', 'company')
      .skip(skip)
      .take(limit)
      .orderBy('supplier.createdAt', 'DESC');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(supplier.name ILIKE :search OR supplier.contact ILIKE :search OR supplier.email ILIKE :search OR supplier.contactPerson ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere('supplier.status = :status', { status });
    }

    if (activeOnly) {
      queryBuilder.andWhere('supplier.status = :activeStatus', { activeStatus: SupplierStatus.ACTIVE });
    }

    if (companyId) {
      queryBuilder.andWhere('supplier.companyId = :companyId', { companyId });
    }

    const [suppliers, total] = await queryBuilder.getManyAndCount();

    return {
      data: suppliers.map(supplier => this.mapToResponseDto(supplier)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    };
  }

  async findOne(id: string): Promise<SupplierResponseDto> {
    const supplier = await this.supplierRepository.findOne({
      where: { id },
      relations: ['company']
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return this.mapToResponseDto(supplier);
  }

  async findByCompany(companyId: string, activeOnly: boolean = true): Promise<SupplierResponseDto[]> {
    const whereCondition: any = { companyId };
    if (activeOnly) {
      whereCondition.status = SupplierStatus.ACTIVE;
    }

    const suppliers = await this.supplierRepository.find({
      where: whereCondition,
      relations: ['company'],
      order: { name: 'ASC' }
    });

    return suppliers.map(supplier => this.mapToResponseDto(supplier));
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto): Promise<SupplierResponseDto> {
    const supplier = await this.supplierRepository.findOne({ where: { id } });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    // Check for name conflict if name is being updated
    if (updateSupplierDto.name && updateSupplierDto.name !== supplier.name) {
      const existingByName = await this.supplierRepository.findOne({
        where: { 
          name: updateSupplierDto.name,
          companyId: supplier.companyId
        }
      });

      if (existingByName && existingByName.id !== id) {
        throw new ConflictException('Supplier with this name already exists in the company');
      }
    }

    // Check for email conflict if email is being updated
    if (updateSupplierDto.email && updateSupplierDto.email !== supplier.email) {
      const existingByEmail = await this.supplierRepository.findOne({
        where: { 
          email: updateSupplierDto.email,
          companyId: supplier.companyId
        }
      });

      if (existingByEmail && existingByEmail.id !== id) {
        throw new ConflictException('Supplier with this email already exists in the company');
      }
    }

    Object.assign(supplier, updateSupplierDto);
    const updatedSupplier = await this.supplierRepository.save(supplier);
    
    return this.findOne(updatedSupplier.id);
  }

  async remove(id: string): Promise<void> {
    const supplier = await this.supplierRepository.findOne({
      where: { id },
      // relations: ['purchaseOrders'] // Uncomment when purchase orders are implemented
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    // Check if supplier has associated purchase orders
    // Uncomment when purchase orders are implemented
    // if (supplier.purchaseOrders && supplier.purchaseOrders.length > 0) {
    //   throw new BadRequestException('Cannot delete supplier with existing purchase orders. Consider deactivating instead.');
    // }

    await this.supplierRepository.softDelete(id);
  }

  async updateStatus(id: string, status: SupplierStatus): Promise<SupplierResponseDto> {
    const result = await this.supplierRepository.update(id, { status });
    
    if (result.affected === 0) {
      throw new NotFoundException('Supplier not found');
    }

    return this.findOne(id);
  }

  async activate(id: string): Promise<SupplierResponseDto> {
    return this.updateStatus(id, SupplierStatus.ACTIVE);
  }

  async deactivate(id: string): Promise<SupplierResponseDto> {
    return this.updateStatus(id, SupplierStatus.INACTIVE);
  }

  async blacklist(id: string): Promise<SupplierResponseDto> {
    return this.updateStatus(id, SupplierStatus.BLACKLISTED);
  }

  async suspend(id: string): Promise<SupplierResponseDto> {
    return this.updateStatus(id, SupplierStatus.SUSPENDED);
  }

  async getSupplierStats(companyId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    blacklisted: number;
    suspended: number;
    pendingApproval: number;
  }> {
    const queryBuilder = this.supplierRepository
      .createQueryBuilder('supplier')
      .select('supplier.status, COUNT(supplier.id) as count')
      .groupBy('supplier.status');

    if (companyId) {
      queryBuilder.andWhere('supplier.companyId = :companyId', { companyId });
    }

    const results = await queryBuilder.getRawMany();
    
    const stats = {
      total: 0,
      active: 0,
      inactive: 0,
      blacklisted: 0,
      suspended: 0,
      pendingApproval: 0
    };

    results.forEach(result => {
      const count = parseInt(result.count);
      stats.total += count;
      
      switch (result.supplier_status) {
        case SupplierStatus.ACTIVE:
          stats.active = count;
          break;
        case SupplierStatus.INACTIVE:
          stats.inactive = count;
          break;
        case SupplierStatus.BLACKLISTED:
          stats.blacklisted = count;
          break;
        case SupplierStatus.SUSPENDED:
          stats.suspended = count;
          break;
        case SupplierStatus.PENDING_APPROVAL:
          stats.pendingApproval = count;
          break;
      }
    });

    return stats;
  }

  private mapToResponseDto(supplier: Supplier): SupplierResponseDto {
    const dto = new SupplierResponseDto();
    Object.assign(dto, supplier);
    
    // Add computed properties
    dto.isActive = supplier.isActive;
    dto.isBlacklisted = supplier.isBlacklisted;
    
    if (supplier.company) {
      dto.company = {
        id: supplier.company.id,
        name: supplier.company.name
      };
    }

    return dto;
  }
}
