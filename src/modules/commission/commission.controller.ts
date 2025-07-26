import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { CreateCommissionDto } from './dto/create-commission.dto';

@Controller('commissions')
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Post()
  async create(@Body() dto: CreateCommissionDto) {
    return this.commissionService.create(dto);
  }

  @Get()
  async findAll() {
    return this.commissionService.findAll();
  }

  @Get('employee/:employeeId')
  async findByEmployee(@Param('employeeId') employeeId: string) {
    return this.commissionService.findByEmployee(employeeId);
  }

  @Get('sale/:saleId')
  async findBySale(@Param('saleId') saleId: string) {
    return this.commissionService.findBySale(saleId);
  }
}
