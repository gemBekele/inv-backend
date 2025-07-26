import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Employee } from '../entities/employee.entity';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeQueryDto, EmployeeResponseDto } from '../dto/employee';
import { User } from '../entities/user.entity';
import { Shop } from '../../shops/entities/shops.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';
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
    private readonly cacheService: CacheService,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    const { userId, shopId, warehouseId, name, phoneNumber, baseCommissionRate, jobTitle } = createEmployeeDto;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const shop = await this.shopRepository.findOne({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');
    const warehouse = await this.warehouseRepository.findOne({ where: { id: warehouseId } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const employee = this.employeeRepository.create({
      name,
      phoneNumber,
      baseCommissionRate: baseCommissionRate || 0,
      jobTitle,
      user,
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

  private createQueryBuilder(): SelectQueryBuilder<Employee> {
    return this.employeeRepository.createQueryBuilder('employee')
      .leftJoin('employee.user', 'user')
      .leftJoin('employee.shop', 'shop')
      .leftJoin('employee.warehouse', 'warehouse')
      .select(['employee', 'user.username', 'shop.name', 'warehouse.name']);
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<Employee>, query: EmployeeQueryDto): void {
    if (query.search) {
      queryBuilder.andWhere('employee.name ILIKE :search OR user.username ILIKE :search OR shop.name ILIKE :search', { search: `%${query.search}%` });
    }
    queryBuilder.orderBy('employee.createdAt', 'DESC');
  }

  private mapToResponseDto(employee: Employee): EmployeeResponseDto {
    return {
      id: employee.id,
      name: employee.name,
      phoneNumber: employee.phoneNumber,
      baseCommissionRate: employee.baseCommissionRate,
      jobTitle: employee.jobTitle,
      userFullName: employee.user.fullName,
      shopName: employee.shop.name,
      warehouseName: employee.warehouse.name,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }

  private async invalidateEmployeeCache(): Promise<void> {
    const deletedCount = await this.cacheService.deletePattern(`${CACHE_KEYS.EMPLOYEE_LIST}*`);
    this.logger.debug(`Cleared ${deletedCount} employee cache entries`);
  }
}