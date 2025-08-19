import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateUserDto } from '@/modules/users/dto/user/create-user.dto';
import { UpdateUserDto } from '@/modules/users/dto/user/update-user.dto';
import { AdminUpdateUserDto } from '@/modules/users/dto/user/admin-user-update.dto';
import { AssignUserDto } from '@/modules/users/dto/user/assign-user.dto';
import { User } from '../../users/entities/user.entity';
import { Employee } from '../../users/entities/employee.entity';
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
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
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
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'isEmailVerified', 'phone','createdAt', 'updatedAt'],
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

  async findByIdWithAssociations(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ 
      where: { id },
      relations: ['company', 'shop', 'warehouse'],
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'isEmailVerified', 'phone', 'createdAt', 'updatedAt'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { phone },
      relations: ['company', 'shop', 'warehouse'],
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'phone', 'createdAt', 'updatedAt'],
    });
  }

  async findMe(user: User): Promise<User> {
    return this.usersRepository.findOne({
      where: { id: user.id },
      relations: ['company', 'shop', 'warehouse', 'employees'],
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'phone', 'isEmailVerified', 'lastLoginAt', 'createdAt', 'updatedAt'],
    });
  }

  async create(dto: CreateUserDto, currentUser?: User): Promise<User> {
  // Get the company for association
  let companyToAssociate: Company | null = null;
  
  // Role-based validation for Company Admins
  if (currentUser && currentUser.role === UserRole.COMPANY_ADMIN) {
    // Company Admin restrictions
    if (dto.role === UserRole.SUPER_ADMIN || dto.role === UserRole.COMPANY_ADMIN) {
      throw new ForbiddenException('Company Admin cannot create Super Admin or Company Admin users');
    }

    // Get company object if currentUser has companyId 
    let userCompany = currentUser.company;
    if (!userCompany && (currentUser as any).companyId) {
      userCompany = await this.companyRepository.findOne({ where: { id: (currentUser as any).companyId } });
    }

    // Force assignment to Company Admin's company
    if (!userCompany) {
      throw new ForbiddenException('Company Admin must be associated with a company');
    }
    
    companyToAssociate = userCompany;
    dto.companyId = userCompany.id;
    
    // If no role specified, default to USER
    if (!dto.role) {
      dto.role = UserRole.USER;
    }
    
    // Validate shop and warehouse belong to admin's company if specified
    if (dto.shopId) {
      const shop = await this.shopRepository.findOne({ 
        where: { id: dto.shopId },
        relations: ['company']
      });
      if (!shop || shop.company?.id !== userCompany.id) {
        throw new ForbiddenException('Shop must belong to your company');
      }
    }
    
    if (dto.warehouseId) {
      const warehouse = await this.warehouseRepository.findOne({ 
        where: { id: dto.warehouseId },
        relations: ['company']
      });
      if (!warehouse || warehouse.company?.id !== userCompany.id) {
        throw new ForbiddenException('Warehouse must belong to your company');
      }
    }
  } else if (dto.companyId) {
    // For Super Admin or when companyId is explicitly provided
    const company = await this.companyRepository.findOne({ where: { id: dto.companyId } });
    if (!company) throw new NotFoundException('Company not found');
    companyToAssociate = company;
  }

  // Check if user exists with same email
  const existingUser = await this.findByEmail(dto.email);
  if (existingUser) {
    throw new ForbiddenException('User Exists!');
  }

  const userData: Partial<User> = {
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    password: dto.password,
    phone: dto.phone,
    role: dto.role || UserRole.USER, // Default to USER role if not specified
  };

  // Assign company if we have one to associate
  if (companyToAssociate) {
    userData.company = companyToAssociate;
  }

  // Assign shop if provided
  if (dto.shopId) {
    const shop = await this.shopRepository.findOne({ where: { id: dto.shopId } });
    if (!shop) throw new NotFoundException('Shop not found');
    userData.shop = shop;
  }

  // Assign warehouse if provided
  if (dto.warehouseId) {
    const warehouse = await this.warehouseRepository.findOne({ where: { id: dto.warehouseId } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    userData.warehouse = warehouse;
  }

  const user = this.usersRepository.create(userData);
  const savedUser = await this.usersRepository.save(user);

  // Auto-create Employee record if user is assigned to a company
  if (userData.company) {
    const employeeData = {
      name: `${savedUser.firstName} ${savedUser.lastName}`,
      phoneNumber: savedUser.phone || '',
      baseCommissionRate: 0, // Default commission rate
      user: savedUser,
      company: userData.company,
      shop: userData.shop || null,
      warehouse: userData.warehouse || null,
    };

    const employee = this.employeeRepository.create(employeeData);
    await this.employeeRepository.save(employee);
  }

  return savedUser;
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

  async toggleUserStatus(userId: string, currentUser: User): Promise<User> {
    if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.role !== UserRole.COMPANY_ADMIN) {
      throw new ForbiddenException('Only admins can toggle user status');
    }

    const user = await this.findById(userId);
    user.status = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    
    return this.usersRepository.save(user);
  }

  /**
   * Bulk assign users to company/shop/warehouse
   */
  async bulkAssignUsers(userIds: string[], assignmentData: AssignUserDto, currentUser: User): Promise<User[]> {
    // Authorization check
    if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.role !== UserRole.COMPANY_ADMIN) {
      throw new ForbiddenException('Only admins can perform bulk assignments');
    }

    const users = await this.usersRepository.find({
      where: { id: In(userIds) },
      relations: ['company', 'shop', 'warehouse']
    });

    if (users.length === 0) {
      throw new NotFoundException('No users found');
    }

    // Company Admin can only assign users within their company
    if (currentUser.role === UserRole.COMPANY_ADMIN) {
      assignmentData.companyId = currentUser.company?.id;
      
      // Validate shop/warehouse belong to admin's company
      if (assignmentData.shopId) {
        const shop = await this.shopRepository.findOne({ 
          where: { id: assignmentData.shopId },
          relations: ['company']
        });
        if (!shop || shop.company?.id !== currentUser.company?.id) {
          throw new ForbiddenException('Shop must belong to your company');
        }
      }
      
      if (assignmentData.warehouseId) {
        const warehouse = await this.warehouseRepository.findOne({ 
          where: { id: assignmentData.warehouseId },
          relations: ['company']
        });
        if (!warehouse || warehouse.company?.id !== currentUser.company?.id) {
          throw new ForbiddenException('Warehouse must belong to your company');
        }
      }
    }

    const updatedUsers: User[] = [];

    for (const user of users) {
      // Apply bulk assignments
      await this.assignUser(user.id, assignmentData, currentUser);
      
      // Reload user with new associations
      const updatedUser = await this.findByIdWithAssociations(user.id);
      updatedUsers.push(updatedUser);
    }

    return updatedUsers;
  }

  /**
   * Get user activity log (placeholder for now - would integrate with audit system)
   */
  async getUserActivityLog(userId: string, currentUser: User): Promise<any[]> {
    // Authorization check
    if (currentUser.role !== UserRole.SUPER_ADMIN && 
        currentUser.role !== UserRole.COMPANY_ADMIN && 
        currentUser.id !== userId) {
      throw new ForbiddenException('Access denied to user activity log');
    }

    const user = await this.findById(userId);
    
    // This would integrate with a proper audit/activity tracking system
    // For now, return basic user information changes
    return [
      {
        id: '1',
        action: 'USER_CREATED',
        timestamp: user.createdAt,
        details: `User ${user.fullName} was created`,
        performedBy: 'system'
      },
      {
        id: '2', 
        action: 'LAST_LOGIN',
        timestamp: user.lastLoginAt || user.createdAt,
        details: `User ${user.fullName} last logged in`,
        performedBy: user.id
      }
      // Additional activity would come from audit logs, login history, etc.
    ];
  }

  /**
   * Get comprehensive user statistics by company
   */
  async getCompanyUserStats(companyId: string, currentUser: User): Promise<any> {
    // Authorization check
    if (currentUser.role === UserRole.COMPANY_ADMIN && currentUser.company?.id !== companyId) {
      throw new ForbiddenException('Access denied to company statistics');
    }

    const users = await this.usersRepository.find({
      where: { company: { id: companyId } },
      relations: ['employees']
    });

    const employees = await this.employeeRepository.find({
      where: { company: { id: companyId } },
      relations: ['user', 'shop', 'warehouse']
    });

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === UserStatus.ACTIVE).length,
      inactiveUsers: users.filter(u => u.status === UserStatus.INACTIVE).length,
      pendingUsers: users.filter(u => u.status === UserStatus.PENDING).length,
      usersByRole: {
        [UserRole.SUPER_ADMIN]: users.filter(u => u.role === UserRole.SUPER_ADMIN).length,
        [UserRole.COMPANY_ADMIN]: users.filter(u => u.role === UserRole.COMPANY_ADMIN).length,
        [UserRole.MANAGER]: users.filter(u => u.role === UserRole.MANAGER).length,
        [UserRole.USER]: users.filter(u => u.role === UserRole.USER).length,
      },
      employees: {
        total: employees.length,
        withShopAssignment: employees.filter(e => e.shop).length,
        withWarehouseAssignment: employees.filter(e => e.warehouse).length,
        averageCommissionRate: employees.reduce((sum, e) => sum + e.baseCommissionRate, 0) / (employees.length || 1)
      }
    };

    return stats;
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
    
    // Handle Employee record creation/update if company is assigned
    if (updateData.company) {
      const existingEmployee = await this.employeeRepository.findOne({
        where: { user: { id: userId } }
      });
      
      if (existingEmployee) {
        // Update existing employee
        existingEmployee.company = updateData.company;
        if (updateData.shop) existingEmployee.shop = updateData.shop;
        if (updateData.warehouse) existingEmployee.warehouse = updateData.warehouse;
        await this.employeeRepository.save(existingEmployee);
      } else {
        // Create new employee record
        const employeeData = {
          name: `${user.firstName} ${user.lastName}`,
          phoneNumber: user.phone || '',
          baseCommissionRate: 0,
          jobTitle: null,
          user: user,
          company: updateData.company,
          shop: updateData.shop || null,
          warehouse: updateData.warehouse || null,
        };
        
        const employee = this.employeeRepository.create(employeeData);
        await this.employeeRepository.save(employee);
      }
    }
    
    return this.findByIdWithAssociations(userId);
  }

  async getCompanyUsers(companyId: string, currentUser: User): Promise<any[]> {
    if (currentUser.role !== UserRole.SUPER_ADMIN && (currentUser as any).companyId !== companyId) {
      throw new ForbiddenException('Access denied');
    }

    const employees = await this.employeeRepository.find({
      where: { company: { id: companyId } },
      relations: ['user', 'company', 'shop', 'warehouse'],
    });

    return employees.map(employee => ({
      id: employee.user.id,
      email: employee.user.email,
      firstName: employee.user.firstName,
      lastName: employee.user.lastName,
      role: employee.user.role,
      status: employee.user.status,
      createdAt: employee.user.createdAt,
      employee: {
        id: employee.id,
        name: employee.name,
        phoneNumber: employee.phoneNumber,
        jobTitle: employee.jobTitle,
        baseCommissionRate: employee.baseCommissionRate
      }
    }));
  }

  async getShopUsers(shopId: string, currentUser: User): Promise<User[]> {
    // Authorization check
    if (currentUser.role === UserRole.COMPANY_ADMIN && (!currentUser.company || !currentUser.shop || currentUser.shop.id !== shopId)) {
      throw new ForbiddenException('Company admin can only access users within their shop');
    }

    return this.usersRepository.find({
      where: { shop: { id: shopId } },
      relations: ['company', 'shop', 'warehouse', 'employees'],
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'phone', 'createdAt', 'updatedAt'],
    });
  }

  async getWarehouseUsers(warehouseId: string, currentUser: User): Promise<User[]> {
    // Authorization check
    if (currentUser.role === UserRole.COMPANY_ADMIN && (!currentUser.company || !currentUser.warehouse || currentUser.warehouse.id !== warehouseId)) {
      throw new ForbiddenException('Company admin can only access users within their warehouse');
    }

    return this.usersRepository.find({
      where: { warehouse: { id: warehouseId } },
      relations: ['company', 'shop', 'warehouse', 'employees'],
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'phone', 'createdAt', 'updatedAt'],
    });
  }

  async findEmployeeByUserId(userId: string): Promise<any> {
    const employee = await this.employeeRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'company', 'shop', 'warehouse']
    });
    return employee;
  }

  async findUserByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { phone },
      relations: ['company', 'shop', 'warehouse'],
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'phone', 'createdAt', 'updatedAt'],
    });
  }
}