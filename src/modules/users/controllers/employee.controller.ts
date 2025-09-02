import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeeService } from '../services/employee.service';
import { EmployeeDashboardService } from '../services/employee-dashboard.service';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeQueryDto, EmployeeResponseDto, AssignEmployeeLocationDto } from '../dto/employee';
import { PaginatedResult } from '@/common/interfaces';
import { JwtAuthGuard, RolesGuard, EmployeeGuard } from '@/common/guards';
import { Roles, CurrentUser } from '@/common/decorators';
import { UserRole } from '@/common/enums';
import { User } from '../entities/user.entity';

@ApiTags('Employees')
@ApiBearerAuth('access-token')
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeController {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly employeeDashboardService: EmployeeDashboardService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiResponse({ status: 201, description: 'Employee created successfully', type: EmployeeResponseDto })
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @CurrentUser() currentUser: any
  ): Promise<EmployeeResponseDto> {
    return this.employeeService.create(createEmployeeDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get all employees with filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of employees', type: [EmployeeResponseDto] })
  async findAll(@Query() query: EmployeeQueryDto): Promise<PaginatedResult<EmployeeResponseDto>> {
    return this.employeeService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an employee by ID' })
  @ApiResponse({ status: 200, description: 'Employee details', type: EmployeeResponseDto })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<EmployeeResponseDto> {
    return this.employeeService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an employee by ID' })
  @ApiBody({ type: UpdateEmployeeDto })
  @ApiResponse({ status: 200, description: 'Employee updated successfully', type: EmployeeResponseDto })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateEmployeeDto: UpdateEmployeeDto): Promise<EmployeeResponseDto> {
    return this.employeeService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an employee by ID' })
  @ApiResponse({ status: 204, description: 'Employee deleted successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.employeeService.remove(id);
  }

  @Patch(':id/assign-location')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Assign warehouse/shop to employee',
    description: 'Assign or update warehouse and/or shop location for an employee'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Employee location assigned successfully',
    type: EmployeeResponseDto
  })
  @ApiResponse({ status: 404, description: 'Employee, warehouse or shop not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async assignEmployeeLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignLocationDto: AssignEmployeeLocationDto,
    @CurrentUser() currentUser: any
  ): Promise<EmployeeResponseDto> {
    return this.employeeService.assignLocation(id, assignLocationDto, currentUser);
  }

  @Get('dashboard/my')
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  @ApiOperation({ 
    summary: 'Get employee dashboard data',
    description: 'Get comprehensive dashboard information for the authenticated employee including sales stats, commissions, and recent activity'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Employee dashboard data',
    schema: {
      type: 'object',
      properties: {
        employee: {
          type: 'object',
          description: 'Employee information and assignments'
        },
        salesStats: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            today: { type: 'number' },
            thisWeek: { type: 'number' },
            thisMonth: { type: 'number' },
            totalRevenue: { type: 'number' },
            todayRevenue: { type: 'number' },
            weekRevenue: { type: 'number' },
            monthRevenue: { type: 'number' },
            averageSaleAmount: { type: 'number' }
          }
        },
        commissionStats: {
          type: 'object',
          properties: {
            totalEarned: { type: 'number' },
            thisMonth: { type: 'number' },
            pending: {
              type: 'object',
              properties: {
                count: { type: 'number' },
                amount: { type: 'number' }
              }
            },
            baseRate: { type: 'number' }
          }
        },
        recentSales: { type: 'array' },
        inventoryAlerts: { type: 'array' },
        permissions: { type: 'object' },
        generatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Employee authentication required' })
  @ApiResponse({ status: 403, description: 'Employee access required' })
  async getMyDashboard(@CurrentUser() user: User) {
    return this.employeeDashboardService.getEmployeeDashboard(user.id);
  }

  @Get('dashboard/quick-actions')
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  @ApiOperation({ 
    summary: 'Get employee quick actions',
    description: 'Get available quick actions based on employee role and permissions'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Quick actions available to the employee',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          icon: { type: 'string' },
          route: { type: 'string' }
        }
      }
    }
  })
  async getQuickActions(@CurrentUser() user: User) {
    return this.employeeDashboardService.getEmployeeQuickActions(user.id);
  }
}