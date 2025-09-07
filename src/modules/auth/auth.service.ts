import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@/modules/users/services/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto, AdminCreateUserDto } from './dto/register.dto';
import { User } from '@/modules/users/entities/user.entity';
import { UserRole, UserStatus } from '@/common/enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmailWithAssociations(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.validateUser(email, password);
    
    // Get employee information
    const employee = await this.usersService.findEmployeeByUserId(user.id);
    
    // Check if user is an employee
    const employeeRoles = [UserRole.SHOP_EMPLOYEE, UserRole.WAREHOUSE_EMPLOYEE, UserRole.MANAGER];
    const isEmployee = employee && employeeRoles.includes(user.role);
    
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.company?.id || employee?.company?.id,
      shopId: user.shop?.id || employee?.shop?.id,
      warehouseId: user.warehouse?.id || employee?.warehouse?.id,
      employeeId: employee?.id,
      isEmployee: isEmployee
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Build response based on whether user is an employee
    const response: any = {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
      routing: {
        companyId: user.company?.id || employee?.company?.id,
        shopId: user.shop?.id || employee?.shop?.id,
        warehouseId: user.warehouse?.id || employee?.warehouse?.id
      }
    };

    // Add employee-specific data if user is an employee
    if (isEmployee) {
      response.employee = {
        id: employee.id,
        name: employee.name,
        phoneNumber: employee.phoneNumber,
        jobTitle: employee.jobTitle,
        baseCommissionRate: employee.baseCommissionRate,
        company: employee.company ? {
          id: employee.company.id,
          name: employee.company.name
        } : null,
        shop: employee.shop ? {
          id: employee.shop.id,
          name: employee.shop.name
        } : null,
        warehouse: employee.warehouse ? {
          id: employee.warehouse.id,
          name: employee.warehouse.name
        } : null
      };
      
      response.permissions = {
        canCreateSales: true,
        canViewSales: true,
        canProcessPayments: true,
        canViewCommissions: true,
        canViewInventory: true
      };
    }

    return response;
  }

  async register(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      parseInt(this.configService.get<string>('BCRYPT_ROUNDS', '12')),
    );

    const userData = {
      ...registerDto,
      password: hashedPassword,
      role: UserRole.USER,
      isEmailVerified: false,
    };

    return this.usersService.create(userData);
  }

  async adminCreateUser(adminCreateUserDto: AdminCreateUserDto, adminUser: User): Promise<User> {
    if (adminUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only admins can create users');
    }

    const existingUser = await this.usersService.findByEmail(adminCreateUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      adminCreateUserDto.password,
      parseInt(this.configService.get<string>('BCRYPT_ROUNDS', '12')),
    );

    const userData = {
      ...adminCreateUserDto,
      password: hashedPassword,
      role: adminCreateUserDto.role || UserRole.USER,
      status: UserStatus.ACTIVE,
      isEmailVerified: adminCreateUserDto.skipEmailVerification || false,
    };

    return this.usersService.create(userData);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const userWithAssociations = await this.usersService.findByIdWithAssociations(user.id);
      const employee = await this.usersService.findEmployeeByUserId(user.id);
      
      // Check if user is an employee
      const employeeRoles = [UserRole.SHOP_EMPLOYEE, UserRole.WAREHOUSE_EMPLOYEE, UserRole.MANAGER];
      const isEmployee = employee && employeeRoles.includes(user.role);
      
      const newPayload = { 
        sub: user.id, 
        email: user.email, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: userWithAssociations.company?.id || employee?.company?.id,
        shopId: userWithAssociations.shop?.id || employee?.shop?.id,
        warehouseId: userWithAssociations.warehouse?.id || employee?.warehouse?.id,
        employeeId: employee?.id,
        isEmployee: isEmployee
      };

      return {
        accessToken: this.jwtService.sign(newPayload),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}