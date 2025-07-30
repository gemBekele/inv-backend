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
    const user = await this.usersService.findByEmail(email);
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
    
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName 
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
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
    if (adminUser.role !== UserRole.ADMIN) {
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

      const newPayload = { 
        sub: user.id, 
        email: user.email, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName 
      };

      return {
        accessToken: this.jwtService.sign(newPayload),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}