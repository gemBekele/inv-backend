import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommissionResponseDto } from './dto/commision-resposne.dto';

@ApiTags('Commissions')
@ApiBearerAuth('access-token')
@Controller('Commissions')
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
}
