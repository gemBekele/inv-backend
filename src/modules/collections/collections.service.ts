import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { Supplier } from './entities/supplier.entity';
import { ProductGroup } from './entities/product-group.entity';
import { CreateBranchDto, UpdateBranchDto, BranchQueryDto, BranchResponseDto } from './dto/branch.dto';
import { CreateSupplierDto, UpdateSupplierDto, SupplierQueryDto, SupplierResponseDto } from './dto/supplier.dto';
import { CreateProductGroupDto, UpdateProductGroupDto, ProductGroupQueryDto, ProductGroupResponseDto, AddProductsToGroupDto, RemoveProductsFromGroupDto } from './dto/product-group.dto';
import { PaginatedResult } from '@/common/interfaces';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(ProductGroup)
    private readonly productGroupRepository: Repository<ProductGroup>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // Branch Management
  async createBranch(createBranchDto: CreateBranchDto): Promise<BranchResponseDto> {
    const existing = await this.branchRepository.findOne({ where: { name: createBranchDto.name } });
    if (existing) {
      throw new ConflictException('Branch with this name already exists');
    }
    const branch = this.branchRepository.create(createBranchDto);
    await this.branchRepository.save(branch);
    return this.mapToDto(branch, BranchResponseDto);
  }

  async findAllBranches(query: BranchQueryDto): Promise<PaginatedResult<BranchResponseDto>> {
    const [data, total] = await this.branchRepository.findAndCount({
      where: query.search ? { name: query.search } : {},
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { data: data.map(b => this.mapToDto(b, BranchResponseDto)), total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) };
  }

  // Supplier Management
  async createSupplier(createSupplierDto: CreateSupplierDto): Promise<SupplierResponseDto> {
    const supplier = this.supplierRepository.create(createSupplierDto);
    await this.supplierRepository.save(supplier);
    return this.mapToDto(supplier, SupplierResponseDto);
  }

  async findAllSuppliers(query: SupplierQueryDto): Promise<PaginatedResult<SupplierResponseDto>> {
    const [data, total] = await this.supplierRepository.findAndCount({
      where: query.search ? { name: query.search } : {},
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { data: data.map(s => this.mapToDto(s, SupplierResponseDto)), total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) };
  }

  // Product Group Management
  async createProductGroup(createProductGroupDto: CreateProductGroupDto): Promise<ProductGroupResponseDto> {
    const { productIds, ...groupData } = createProductGroupDto;
    const group = this.productGroupRepository.create(groupData);

    if (productIds && productIds.length > 0) {
      const products = await this.productRepository.findByIds(productIds);
      group.products = products;
    }

    await this.productGroupRepository.save(group);
    return this.mapToDto(group, ProductGroupResponseDto);
  }

  async findAllProductGroups(query: ProductGroupQueryDto): Promise<PaginatedResult<ProductGroupResponseDto>> {
    const [data, total] = await this.productGroupRepository.findAndCount({
        where: query.search ? { name: query.search } : {},
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      });
      return { data: data.map(g => this.mapToDto(g, ProductGroupResponseDto)), total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) };
  }

  // Generic DTO Mapper
  private mapToDto<T, D>(source: T, dtoClass: new () => D): D {
    const dto = new dtoClass();
    Object.assign(dto, source);
    return dto;
  }
}
