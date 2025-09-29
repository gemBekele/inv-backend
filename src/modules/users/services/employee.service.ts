import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Employee } from '../entities/employee.entity';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeQueryDto, EmployeeResponseDto, AssignEmployeeLocationDto } from '../dto/employee';
import { User } from '../entities/user.entity';
import { Shop } from '../../shops/entities/shops.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { Company } from '../../company/entities/company.entity';
import { CacheService } from '@/shared/cache/cache.service';
import { PaginatedResult } from '@/common/interfaces';
import { CACHE_KEYS } from '@/common/constants';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly cacheService: CacheService,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto, currentUser?: any): Promise<EmployeeResponseDto> {
    const { userId, shopId, warehouseId, companyId, name, phoneNumber, baseCommissionRate, jobTitle } = createEmployeeDto;
    
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    // Auto-assign company from current user if company admin
    let company = null;
    if (companyId) {
      company = await this.companyRepository.findOne({ where: { id: companyId } });
      if (!company) throw new NotFoundException('Company not found');
    } else if (currentUser?.companyId) {
      company = await this.companyRepository.findOne({ where: { id: currentUser.companyId } });
    }
    
    let shop = null;
    if (shopId) {
      shop = await this.shopRepository.findOne({ where: { id: shopId } });
      if (!shop) throw new NotFoundException('Shop not found');
    }
    
    let warehouse = null;
    if (warehouseId) {
      warehouse = await this.warehouseRepository.findOne({ where: { id: warehouseId } });
      if (!warehouse) throw new NotFoundException('Warehouse not found');
    }

    const employee = this.employeeRepository.create({
      name,
      phoneNumber,
      baseCommissionRate: baseCommissionRate || 0,
      jobTitle,
      user,
      company,
      shop,
      warehouse,
    });
    
    const savedEmployee = await this.employeeRepository.save(employee);
    await this.invalidateEmployeeCache();
    return this.mapToResponseDto(savedEmployee);
  }

  async findAll(query: EmployeeQueryDto): Promise<PaginatedResult<EmployeeResponseDto>> {
    const cacheKey = this.cacheService.generateKey(CACHE_KEYS.EMPLOYEE_LIST, JSON.stringify(query));
    const cached = await this.cacheService.get<PaginatedResult<EmployeeResponseDto>>(cacheKey);
    if (cached) return cached;

    const queryBuilder = this.createQueryBuilder();
    this.applyFilters(queryBuilder, query);

    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [employees, total] = await queryBuilder.getManyAndCount();

    const result = {
      data: employees.map(employee => this.mapToResponseDto(employee)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await this.cacheService.set(cacheKey, result, 300000);
    return result;
  }

  async findOne(id: string): Promise<EmployeeResponseDto> {
    const cacheKey = this.cacheService.generateKey(CACHE_KEYS.EMPLOYEE_DETAIL, id);
    const cached = await this.cacheService.get<EmployeeResponseDto>(cacheKey);
    if (cached) return cached;

    const employee = await this.employeeRepository.findOne({ where: { id }, relations: ['user', 'shop', 'warehouse'] });
    if (!employee) throw new NotFoundException('Employee not found');
    const result = this.mapToResponseDto(employee);
    await this.cacheService.set(cacheKey, result, 600000);
    return result;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepository.findOne({ where: { id }, relations: ['user', 'shop', 'warehouse'] });
    if (!employee) throw new NotFoundException('Employee not found');
    Object.assign(employee, updateEmployeeDto);
    const updatedEmployee = await this.employeeRepository.save(employee);
    await this.invalidateEmployeeCache();
    await this.cacheService.del(this.cacheService.generateKey(CACHE_KEYS.EMPLOYEE_DETAIL, id));
    return this.mapToResponseDto(updatedEmployee);
  }

  async remove(id: string): Promise<void> {
    const employee = await this.employeeRepository.findOne({ where: { id } });
    if (!employee) throw new NotFoundException('Employee not found');
    await this.employeeRepository.softDelete(id);
    await this.invalidateEmployeeCache();
    await this.cacheService.del(this.cacheService.generateKey(CACHE_KEYS.EMPLOYEE_DETAIL, id));
  }

  async assignLocation(id: string, assignLocationDto: AssignEmployeeLocationDto, currentUser?: any): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepository.findOne({ 
      where: { id }, 
      relations: ['user', 'shop', 'warehouse', 'company'] 
    });
    
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check permissions - only allow assignment within same company for company admins
    if (currentUser?.role === 'company_admin' && employee.company?.id !== currentUser.companyId) {
      throw new ForbiddenException('You can only assign locations to employees within your company');
    }

    // Assign warehouse if provided
    if (assignLocationDto.warehouseId) {
      const warehouse = await this.warehouseRepository.findOne({ 
        where: { id: assignLocationDto.warehouseId },
        relations: ['company']
      });
      
      if (!warehouse) {
        throw new NotFoundException('Warehouse not found');
      }

      // Validate warehouse belongs to same company
      if (employee.company && warehouse.company?.id !== employee.company.id) {
        throw new ForbiddenException('Warehouse must belong to the same company as the employee');
      }
      
      employee.warehouse = warehouse;
    } else if (assignLocationDto.warehouseId === null) {
      // Allow removing warehouse assignment
      employee.warehouse = null;
    }

    // Assign shop if provided
    if (assignLocationDto.shopId) {
      const shop = await this.shopRepository.findOne({ 
        where: { id: assignLocationDto.shopId },
        relations: ['company']
      });
      
      if (!shop) {
        throw new NotFoundException('Shop not found');
      }

      // Validate shop belongs to same company
      if (employee.company && shop.company?.id !== employee.company.id) {
        throw new ForbiddenException('Shop must belong to the same company as the employee');
      }
      
      employee.shop = shop;
    } else if (assignLocationDto.shopId === null) {
      // Allow removing shop assignment
      employee.shop = null;
    }

    // Save the updated employee
    const updatedEmployee = await this.employeeRepository.save(employee);
    
    // Also update the user's warehouse/shop assignment if needed
    if (employee.user) {
      const userUpdate: any = {};
      if (assignLocationDto.warehouseId !== undefined) {
        userUpdate.warehouse = employee.warehouse;
      }
      if (assignLocationDto.shopId !== undefined) {
        userUpdate.shop = employee.shop;
      }
      
      if (Object.keys(userUpdate).length > 0) {
        await this.userRepository.update(employee.user.id, userUpdate);
      }
    }

    await this.invalidateEmployeeCache();
    await this.cacheService.del(this.cacheService.generateKey(CACHE_KEYS.EMPLOYEE_DETAIL, id));
    
    // Return updated employee with new assignments
    const refreshedEmployee = await this.employeeRepository.findOne({ 
      where: { id }, 
      relations: ['user', 'shop', 'warehouse'] 
    });
    
    return this.mapToResponseDto(refreshedEmployee);
  }

  private createQueryBuilder(): SelectQueryBuilder<Employee> {
    return this.employeeRepository.createQueryBuilder('employee')
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('employee.shop', 'shop')
      .leftJoinAndSelect('employee.warehouse', 'warehouse');
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<Employee>, query: EmployeeQueryDto): void {
    if (query.search) {
      queryBuilder.andWhere(
        '(employee.name ILIKE :search OR CONCAT(user.firstName, \'\', user.lastName) ILIKE :search OR employee.jobTitle ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }
    queryBuilder.orderBy('employee.createdAt', 'DESC');
  }

  private mapToResponseDto(employee: Employee): EmployeeResponseDto {
    console.log('Mapping employee to response DTO:', employee);
    return {
      id: employee.id,
      name: employee.name,
      phoneNumber: employee.phoneNumber,
      baseCommissionRate: employee.baseCommissionRate,
      jobTitle: employee.jobTitle,
      userFullName: employee.name,
      shopName: employee.shop?.name,
      warehouseName: employee.warehouse?.name || '',
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }

  private async invalidateEmployeeCache(): Promise<void> {
    const deletedCount = await this.cacheService.deletePattern(`${CACHE_KEYS.EMPLOYEE_LIST}*`);
    this.logger.debug(`Cleared ${deletedCount} employee cache entries`);
  }
}