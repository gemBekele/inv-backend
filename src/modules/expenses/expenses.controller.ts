import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators';
import { PaginationDto } from '@/common/dto';
import { ExpensesService } from './expenses.service';
import { ExpenseApprovalLevel } from './enums';
import { 
  CreateExpenseDto,
  ExpenseResponseDto,
  ExpenseQueryDto,
  ExpenseApprovalDto,
  ExpenseRejectionDto,
  AddExpenseAttachmentDto,
  ExpenseDashboardStatsFiltersDto
} from './dto';

@ApiTags('Expenses')
@ApiBearerAuth('access-token')
@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiResponse({ status: 201, description: 'Expense created successfully', type: ExpenseResponseDto })
  async create(@Body() createExpenseDto: CreateExpenseDto, @CurrentUser('id') userId: string) {
    return this.expensesService.create(createExpenseDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all expenses with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Expenses retrieved successfully' })
  async findAll(@Query() query: ExpenseQueryDto) {
    console.log("Query received in controller:", query);
    
    // Extract pagination
    const paginationDto = {
      page: query.page || 1,
      limit: query.limit || 10
    };
    
    // Convert single enum values to arrays for service compatibility
    const serviceFilters = {
      status: query.status ? [query.status] : undefined,
      type: query.type ? [query.type] : undefined,
      category: query.category ? [query.category] : undefined,
      submittedBy: query.submittedBy,
      startDate: query.startDate,
      endDate: query.endDate,
    };
    return this.expensesService.findAll(paginationDto, serviceFilters);
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get expense dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  async getDashboardStats(@Query() filters: ExpenseDashboardStatsFiltersDto, @CurrentUser() user: any) {
    return this.expensesService.getDashboardStats(filters, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an expense by ID' })
  @ApiResponse({ status: 200, description: 'Expense retrieved successfully', type: ExpenseResponseDto })
  async findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id/submit')
  @ApiOperation({ summary: 'Submit an expense for approval' })
  @ApiResponse({ status: 200, description: 'Expense submitted successfully' })
  async submit(@Param('id') id: string) {
    return this.expensesService.submitExpense(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve an expense' })
  @ApiResponse({ status: 200, description: 'Expense approved successfully' })
  async approve(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: ExpenseApprovalDto
  ) {
    return this.expensesService.approveExpense(
      id, 
      userId, 
      body.approvalLevel,
      body.comments,
      body.approvedAmount
    );
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject an expense' })
  @ApiResponse({ status: 200, description: 'Expense rejected successfully' })
  async reject(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: ExpenseRejectionDto
  ) {
    return this.expensesService.rejectExpense(
      id, 
      userId, 
      body.approvalLevel,
      body.rejectionReason
    );
  }

  @Patch(':id/mark-paid')
  @ApiOperation({ summary: 'Mark expense as paid' })
  @ApiResponse({ status: 200, description: 'Expense marked as paid successfully' })
  async markAsPaid(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.expensesService.markAsPaid(id, userId);
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Add attachment to expense' })
  @ApiResponse({ status: 201, description: 'Attachment added successfully' })
  async addAttachment(@Param('id') expenseId: string, @Body() attachmentData: AddExpenseAttachmentDto) {
    return this.expensesService.addAttachment(expenseId, attachmentData);
  }
}
