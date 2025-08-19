import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from '@/modules/users/services/users.service';
import { CreateUserDto } from '@/modules/users/dto/user/create-user.dto';
import { UpdateUserDto } from '@/modules/users/dto/user/update-user.dto';
import { AdminUpdateUserDto } from '@/modules/users/dto/user/admin-user-update.dto';
import { AssignUserDto } from '@/modules/users/dto/user/assign-user.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, Roles } from '@/common/decorators';
import { User } from '../../users/entities/user.entity';
import { PaginationDto } from '@/common/dto';
import { UserRole } from '@/common/enums';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- USER ENDPOINTS ---

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current logged in user' })
  getMe(@CurrentUser() user: User) {
    return this.usersService.findMe(user);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(@Body() dto: UpdateUserDto, @CurrentUser() user: User) {
    return this.usersService.update(user.id, dto, user);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete current user account' })
  deleteMe(@CurrentUser() user: User) {
    return this.usersService.remove(user.id, user);
  }

  // --- ADMIN ENDPOINTS ---

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create a new user with optional auto-assignment (Super Admin and Company Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User with email already exists' })
  @ApiResponse({ status: 403, description: 'Company Admin can only create users within their company' })
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.create(createUserDto, currentUser);
  }

  @Post('admin/bulk-assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Bulk assign multiple users to company/shop/warehouse' })
  @ApiResponse({ status: 200, description: 'Users assigned successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async bulkAssignUsers(
    @Body() body: { userIds: string[], assignmentData: AssignUserDto },
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.bulkAssignUsers(body.userIds, body.assignmentData, currentUser);
  }

  @Get('admin/activity/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get user activity log' })
  @ApiResponse({ status: 200, description: 'Activity log retrieved' })
  async getUserActivityLog(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.getUserActivityLog(userId, currentUser);
  }

  @Get('admin/company-stats/:companyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get comprehensive user statistics by company' })
  @ApiResponse({ status: 200, description: 'Company user statistics retrieved' })
  async getCompanyUserStats(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.getCompanyUserStats(companyId, currentUser);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  getUserStats() {
    return this.usersService.getUserStats();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all users with pagination (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() pagination: PaginationDto) {
    return this.usersService.findAll(pagination);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin update user (Admin only)' })
  adminUpdate(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
    @CurrentUser() admin: User,
  ) {
    return this.usersService.adminUpdate(id, dto, admin);
  }

  @Patch('admin/:id/toggle-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle user active/inactive status (Admin only)' })
  toggleStatus(
    @Param('id') id: string,
    @CurrentUser() admin: User,
  ) {
    return this.usersService.toggleUserStatus(id, admin);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  remove(@Param('id') id: string, @CurrentUser() admin: User) {
    return this.usersService.remove(id, admin);
  }

  @Post('admin/:id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Assign user to company/shop/warehouse' })
  @ApiResponse({ status: 200, description: 'User assigned successfully' })
  async assignUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignDto: AssignUserDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.assignUser(id, assignDto, currentUser);
  }

  @Get('company/:companyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get users in a company' })
  @ApiResponse({ status: 200, description: 'Company users retrieved successfully' })
  async getCompanyUsers(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.getCompanyUsers(companyId, currentUser);
  }

  @Get('shop/:shopId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get users in a shop' })
  @ApiResponse({ status: 200, description: 'Shop users retrieved successfully' })
  async getShopUsers(
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.getShopUsers(shopId, currentUser);
  }

  @Get('warehouse/:warehouseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get users in a warehouse' })
  @ApiResponse({ status: 200, description: 'Warehouse users retrieved successfully' })
  async getWarehouseUsers(
    @Param('warehouseId', ParseUUIDPipe) warehouseId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.getWarehouseUsers(warehouseId, currentUser);
  }
}