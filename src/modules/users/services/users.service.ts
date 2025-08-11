

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '@/modules/users/dto/user/create-user.dto';
import { UpdateUserDto } from '@/modules/users/dto/user/update-user.dto';
import { AdminUpdateUserDto } from '@/modules/users/dto/user/admin-user-update.dto';
import { AssignUserDto } from '@/modules/users/dto/user/assign-user.dto';
import { User } from '../../users/entities/user.entity';
import { Company } from '@/modules/company/entities/company.entity';
import { Shop } from '@/modules/shops/entities/shops.entity';
import { Warehouse } from '@/modules/warehouse/entities/warehouse.entity';
import { UserRole, UserStatus } from '@/common/enums';
import { PaginationDto } from '@/common/dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
  ) {}

  async findAll(pagination?: PaginationDto): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const [users, total] = await this.usersRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'isEmailVerified', 'createdAt', 'updatedAt'],
    });

    return { users, total };
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ 
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'isEmailVerified', 'phone', 'createdAt', 'updatedAt'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByEmailWithAssociations(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { email },
      relations: ['company', 'shop', 'warehouse']
    });
  }

  async findByIdWithAssociations(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { id },
      relations: ['company', 'shop', 'warehouse']
    });
  }

  async findMe(user: User): Promise<User> {
    return this.findById(user.id);
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(dto);
    return this.usersRepository.save(user);
  }

  async update(id: string, dto: UpdateUserDto, currentUser: User): Promise<User> {
    // Users can only update their own profile unless they're admin
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    await this.usersRepository.update(id, dto);
    return this.findById(id);
  }

  async adminUpdate(id: string, dto: AdminUpdateUserDto, adminUser: User): Promise<User> {
    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can perform this action');
    }

    await this.usersRepository.update(id, dto);
    return this.findById(id);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete users');
    }

    // Prevent admin from deleting themselves
    if (currentUser.id === id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async toggleUserStatus(id: string, adminUser: User): Promise<User> {
    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can toggle user status');
    }

    const user = await this.findById(id);
    
    // Prevent admin from deactivating themselves
    if (adminUser.id === id) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    const newStatus = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    await this.usersRepository.update(id, { status: newStatus });
    
    return this.findById(id);
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    admins: number;
    users: number;
  }> {
    const [total, active, inactive, admins, users] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { status: UserStatus.ACTIVE } }),
      this.usersRepository.count({ where: { status: UserStatus.INACTIVE } }),
      this.usersRepository.count({ where: { role: UserRole.ADMIN } }),
      this.usersRepository.count({ where: { role: UserRole.USER } }),
    ]);

    return { total, active, inactive, admins, users };
  }

  async assignUser(userId: string, assignDto: AssignUserDto, currentUser: User): Promise<User> {
    // Only super admin can assign company admins, company admins can assign within their company
    if (assignDto.role === UserRole.COMPANY_ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admin can assign company admins');
    }

    if (currentUser.role === UserRole.COMPANY_ADMIN && assignDto.companyId !== currentUser.company?.id) {
      throw new ForbiddenException('Company admin can only assign users within their company');
    }

    const user = await this.findById(userId);
    const updateData: Partial<User> = {};

    if (assignDto.companyId) {
      const company = await this.companyRepository.findOne({ where: { id: assignDto.companyId } });
      if (!company) throw new NotFoundException('Company not found');
      updateData.company = company;
    }

    if (assignDto.shopId) {
      const shop = await this.shopRepository.findOne({ where: { id: assignDto.shopId } });
      if (!shop) throw new NotFoundException('Shop not found');
      updateData.shop = shop;
    }

    if (assignDto.warehouseId) {
      const warehouse = await this.warehouseRepository.findOne({ where: { id: assignDto.warehouseId } });
      if (!warehouse) throw new NotFoundException('Warehouse not found');
      updateData.warehouse = warehouse;
    }

    if (assignDto.role) {
      updateData.role = assignDto.role;
    }

    await this.usersRepository.update(userId, updateData);
    return this.findByIdWithAssociations(userId);
  }

  async getCompanyUsers(companyId: string, currentUser: User): Promise<User[]> {
    if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.company?.id !== companyId) {
      throw new ForbiddenException('Access denied');
    }

    return this.usersRepository.find({
      where: { company: { id: companyId } },
      relations: ['company', 'shop', 'warehouse'],
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'createdAt']
    });
  }

  async getShopUsers(shopId: string, currentUser: User): Promise<User[]> {
    const shop = await this.shopRepository.findOne({ where: { id: shopId }, relations: ['company'] });
    if (!shop) throw new NotFoundException('Shop not found');

    if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.company?.id !== shop.company.id) {
      throw new ForbiddenException('Access denied');
    }

    return this.usersRepository.find({
      where: { shop: { id: shopId } },
      relations: ['company', 'shop', 'warehouse'],
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'createdAt']
    });
  }

  async getWarehouseUsers(warehouseId: string, currentUser: User): Promise<User[]> {
    const warehouse = await this.warehouseRepository.findOne({ where: { id: warehouseId }, relations: ['company'] });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.company?.id !== warehouse.company.id) {
      throw new ForbiddenException('Access denied');
    }

    return this.usersRepository.find({
      where: { warehouse: { id: warehouseId } },
      relations: ['company', 'shop', 'warehouse'],
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'createdAt']
    });
  }
}