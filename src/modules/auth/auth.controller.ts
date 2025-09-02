import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto, AdminCreateUserDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { User } from '../users/entities/user.entity';
import { UserRole } from '@/common/enums';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User and Employee login',
    description: 'Authenticate users and employees. Returns employee-specific information if the user is an employee.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful. Returns additional employee data if user is an employee.'
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    const { password, ...userWithoutPassword } = user;
    return { 
      message: 'User registered successfully',
      user: userWithoutPassword 
    };
  }

  @Post('admin/create-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin create user' })
  @ApiResponse({ status: 201, description: 'User created successfully by admin' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async adminCreateUser(
    @Body() adminCreateUserDto: AdminCreateUserDto,
    @CurrentUser() adminUser: User,
  ) {
    if (!adminUser || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(adminUser.role)) {
      throw new Error('Forbidden - Admin access required');
    }
    const user = await this.authService.adminCreateUser(adminCreateUserDto, adminUser);
    const { password, ...userWithoutPassword } = user;
    return { 
      message: 'User created successfully',
      user: userWithoutPassword 
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }
}