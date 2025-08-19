import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, UseGuards, Query, ParseUUIDPipe } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CommissionResponseDto } from './dto/commision-resposne.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles, CurrentUser } from '@/common/decorators';
import { UserRole } from '@/common/enums';
import { User } from '../users/entities/user.entity';

@ApiTags('Commissions')
@ApiBearerAuth('access-token')
@Controller('Commissions')
@UseGuards(JwtAuthGuard)
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new commission' })
  @ApiBody({ type: CreateCommissionDto })
  @ApiResponse({
    status: 201,
    description: 'Commission created successfully',
    type: CommissionResponseDto,
  })
  async create(@Body() dto: CreateCommissionDto) {
    return this.commissionService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all commissions' })
  @ApiResponse({
    status: 200,
    description: 'Commissions found successfully',
    type: CommissionResponseDto,
  })
  async findAll() {
    return this.commissionService.findAll();
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Find commissions by employee' })
  @ApiResponse({
    status: 200,
    description: 'Commissions found successfully',
    type: CommissionResponseDto,
  })
  async findByEmployee(@Param('employeeId') employeeId: string) {
    return this.commissionService.findByEmployee(employeeId);
  }

  @Get('sale/:saleId')
  @ApiOperation({ summary: 'Find commissions by sale' })
  @ApiResponse({
    status: 200,
    description: 'Commissions found successfully',
    type: CommissionResponseDto,
  })
  async findBySale(@Param('saleId') saleId: string) {
    return this.commissionService.findBySale(saleId);
  }

  @Post('approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve multiple commissions' })
  @ApiBody({ schema: { type: 'object', properties: { commissionIds: { type: 'array', items: { type: 'string' } } } } })
  @ApiResponse({ status: 200, description: 'Commissions approved successfully' })
  async approveCommissions(
    @Body('commissionIds') commissionIds: string[],
    @CurrentUser() user: User
  ) {
    return this.commissionService.approveCommissions(commissionIds, user);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get pending commissions for approval' })
  @ApiResponse({ status: 200, description: 'Pending commissions retrieved' })
  async getPendingCommissions(@CurrentUser() user: User) {
    return this.commissionService.getPendingCommissions(user);
  }

  @Get('report/:employeeId')
  @ApiOperation({ summary: 'Get commission report for an employee' })
  @ApiQuery({ name: 'startDate', type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', type: String, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Commission report generated' })
  async getCommissionReport(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    };
    return this.commissionService.getCommissionReport(employeeId, dateRange);
  }
}
