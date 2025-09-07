import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto, UpdateCompanyDto, CompanyQueryDto, CompanyResponseDto } from './dto';
import { PaginatedResult } from '../../common/interfaces';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { Shop } from '../shops/entities/shops.entity';
import { BaseMultiTenantService, MultiTenantUser } from '@/common/services/base-multi-tenant.service';

@Injectable()
export class CompanyService extends BaseMultiTenantService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {
    super();
  }

  async create(createCompanyDto: CreateCompanyDto): Promise<CompanyResponseDto> {
	const existingCompany = await this.companyRepository.findOne({ where: { name: createCompanyDto.name } });
	if (existingCompany) {
	  throw new ConflictException('Company with this name already exists');
	}

    // Create company first
    const { warehouseIds, ...companyData } = createCompanyDto;
    const company = this.companyRepository.create(companyData);
    const savedCompany = await this.companyRepository.save(company);

    // Associate warehouses if provided
    if (warehouseIds && warehouseIds.length > 0) {
      const warehouses = await this.warehouseRepository.findBy({ id: In(warehouseIds) });
      if (warehouses.length !== warehouseIds.length) {
        throw new NotFoundException('One or more warehouses not found');
      }
      
      // Update warehouses to associate with the company
      for (const warehouse of warehouses) {
        warehouse.company = savedCompany;
        await this.warehouseRepository.save(warehouse);
      }
    }

    // Return company with warehouses
    const companyWithWarehouses = await this.companyRepository.findOne({ 
      where: { id: savedCompany.id }, 
      relations: ['warehouses'] 
    });
    return this.mapToResponseDto(companyWithWarehouses);
  }

  async findAll(query: CompanyQueryDto, user?: MultiTenantUser): Promise<PaginatedResult<CompanyResponseDto>> {
    const { search } = query;
    const queryBuilder = this.companyRepository.createQueryBuilder('company')
      .leftJoinAndSelect('company.warehouses', 'warehouses')
      .leftJoinAndSelect('company.shops', 'shops')
      .leftJoinAndSelect('company.employees', 'employees')
      .leftJoinAndSelect('employees.user', 'user');
    
    // Apply company filtering based on user role
    if (user && user.role !== 'super_admin') {
      if (user.companyId) {
        queryBuilder.andWhere('company.id = :userCompanyId', {
          userCompanyId: user.companyId,
        });
      } else {
        queryBuilder.andWhere('1 = 0'); // No results if no company
      }
    }
    
    if (search) {
      queryBuilder.andWhere('company.name LIKE :search OR company.address LIKE :search', { search: `%${search}%` });
    }
    
    const [companies, total] = await queryBuilder
      .skip(0)
      .take(10)
      .getManyAndCount();
      
    return {
      data: companies.map(this.mapToResponseDto),
      total,
      page: 1,
      limit: 10,
      totalPages: Math.ceil(total / 10),
    };
  }

  async findOne(id: string, user?: MultiTenantUser): Promise<CompanyResponseDto> {
    const queryBuilder = this.companyRepository.createQueryBuilder('company')
      .leftJoinAndSelect('company.warehouses', 'warehouses')
      .leftJoinAndSelect('company.shops', 'shops')
      .leftJoinAndSelect('company.employees', 'employees')
      .leftJoinAndSelect('employees.user', 'user')
      .leftJoinAndSelect('company.users', 'users')
      .where('company.id = :id', { id });
    
    // Apply company filtering
    if (user && user.role !== 'super_admin') {
      if (user.companyId) {
        queryBuilder.andWhere('company.id = :userCompanyId', {
          userCompanyId: user.companyId,
        });
      } else {
        queryBuilder.andWhere('1 = 0');
      }
    }
    
    const company = await queryBuilder.getOne();
    if (!company) throw new NotFoundException('Company not found');
    return this.mapToResponseDto(company);
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, user?: MultiTenantUser): Promise<CompanyResponseDto> {
    const queryBuilder = this.companyRepository.createQueryBuilder('company')
      .where('company.id = :id', { id });
    
    // Apply company filtering
    if (user && user.role !== 'super_admin') {
      if (user.companyId) {
        queryBuilder.andWhere('company.id = :userCompanyId', {
          userCompanyId: user.companyId,
        });
      } else {
        queryBuilder.andWhere('1 = 0');
      }
    }
    
    const company = await queryBuilder.getOne();
    if (!company) throw new NotFoundException('Company not found');
    
    Object.assign(company, updateCompanyDto);
    const updatedCompany = await this.companyRepository.save(company);
    return this.mapToResponseDto(updatedCompany);
  }

  async remove(id: string, user?: MultiTenantUser): Promise<void> {
    const queryBuilder = this.companyRepository.createQueryBuilder('company')
      .where('company.id = :id', { id });
    
    // Apply company filtering
    if (user && user.role !== 'super_admin') {
      if (user.companyId) {
        queryBuilder.andWhere('company.id = :userCompanyId', {
          userCompanyId: user.companyId,
        });
      } else {
        queryBuilder.andWhere('1 = 0');
      }
    }
    
    const company = await queryBuilder.getOne();
    if (!company) throw new NotFoundException('Company not found');
    
    const result = await this.companyRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Company not found');
  }

  async addWarehouses(companyId: string, warehouseIds: string[], user?: MultiTenantUser): Promise<CompanyResponseDto> {
    // Validate company access
    if (user) {
      this.validateCompanyAccess(user, companyId);
    }
    
    const company = await this.companyRepository.findOne({ where: { id: companyId }, relations: ['warehouses'] });
    if (!company) throw new NotFoundException('Company not found');

  const warehouses = await this.warehouseRepository.findBy({ id: In(warehouseIds) });
  if (!warehouses || warehouses.length === 0) throw new NotFoundException('Warehouse not found');

   
   for (const warehouse of warehouses) {
    warehouse.company = company;
    await this.warehouseRepository.save(warehouse);
  }
    // Optionally reload company with updated warehouses
    const updatedCompany = await this.companyRepository.findOne({ where: { id: companyId }, relations: ['warehouses'] });
    return this.mapToResponseDto(updatedCompany);
  }

  async getWarehouses(companyId: string, user?: MultiTenantUser): Promise<CompanyResponseDto> {
    // Validate company access
    if (user) {
      this.validateCompanyAccess(user, companyId);
    }
    
    const company = await this.companyRepository.findOne({ where: { id: companyId }, relations: ['warehouses'] });
    if (!company) throw new NotFoundException('Company not found');
    return this.mapToResponseDto(company);
  }

  async addShops(companyId: string, shopIds: string[], user?: MultiTenantUser): Promise<CompanyResponseDto> {
    // Validate company access
    if (user) {
      this.validateCompanyAccess(user, companyId);
    }
    
    const company = await this.companyRepository.findOne({ where: { id: companyId }, relations: ['shops'] });
    if (!company) throw new NotFoundException('Company not found');

    const shops = await this.shopRepository.findBy({ id: In(shopIds) });
    if (!shops || shops.length === 0) throw new NotFoundException('Shop not found');

    for (const shop of shops) {
      shop.company = company;
      await this.shopRepository.save(shop);
    }
    
    // Optionally reload company with updated shops
    const updatedCompany = await this.companyRepository.findOne({ where: { id: companyId }, relations: ['shops'] });
    return this.mapToResponseDto(updatedCompany);
  }

  async getShops(companyId: string, user?: MultiTenantUser): Promise<CompanyResponseDto> {
    // Validate company access
    if (user) {
      this.validateCompanyAccess(user, companyId);
    }
    
    const company = await this.companyRepository.findOne({ where: { id: companyId }, relations: ['shops'] });
    if (!company) throw new NotFoundException('Company not found');
    return this.mapToResponseDto(company);
  }

  private mapToResponseDto(company: Company): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      address: company.address,
      phoneNumber: company.phoneNumber,
      email: company.email,
      description: company.description,
	    warehouses: company.warehouses ? company.warehouses.map(warehouse => ({
        id: warehouse.id,
        name: warehouse.name })) : [],
	    shops: company.shops ? company.shops.map(shop => ({
        id: shop.id,
        name: shop.name
      })) : [],
      employees: company.employees ? company.employees.map(employee => ({
        id: employee.id,
        name: employee.name,
        phoneNumber: employee.phoneNumber,
        jobTitle: employee.jobTitle,
        baseCommissionRate: employee.baseCommissionRate,
        userId: employee.user?.id,
        userName: employee.user ? `${employee.user.firstName} ${employee.user.lastName}` : null,
        userEmail: employee.user?.email,
      })) : [],
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}