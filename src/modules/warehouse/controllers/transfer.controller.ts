import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TransferService } from '../services/transfer.service';
import {
  CreateTransferDto,
  UpdateTransferDto,
  TransferResponseDto,
  TransferQueryDto,
} from '../dto/transfer.dto';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { Roles, CurrentUser } from '../../../common/decorators';
import { UserRole } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { PaginatedResult } from '../../../common/interfaces';

@ApiTags('Inventory Transfers')
@ApiBearerAuth('access-token')
@Controller('transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new inventory transfer or request' })
  @ApiResponse({
    status: 201,
    description: 'Transfer created successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(
    @Body() createTransferDto: CreateTransferDto,
    @CurrentUser() user: User,
  ): Promise<TransferResponseDto> {
    return this.transferService.create(createTransferDto, user);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.MANAGER,
    UserRole.SHOP_EMPLOYEE,
  )
  @ApiOperation({ summary: 'Get all transfers with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Transfers retrieved successfully',
  })
  async findAll(
    @Query() query: TransferQueryDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedResult<TransferResponseDto>> {
    return this.transferService.findAll(query, user);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.MANAGER,
    UserRole.SHOP_EMPLOYEE,
  )
  @ApiOperation({ summary: 'Get transfer by ID' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({
    status: 200,
    description: 'Transfer retrieved successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<TransferResponseDto> {
    return this.transferService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update transfer' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({
    status: 200,
    description: 'Transfer updated successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTransferDto: UpdateTransferDto,
    @CurrentUser() user: User,
  ): Promise<TransferResponseDto> {
    return this.transferService.update(id, updateTransferDto, user);
  }

  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve pending transfer' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({
    status: 200,
    description: 'Transfer approved successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  @ApiResponse({ status: 400, description: 'Transfer cannot be approved' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<TransferResponseDto> {
    return this.transferService.approve(id, user);
  }

  @Post(':id/accept')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept delivered transfer and complete inventory movement' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({
    status: 200,
    description: 'Transfer accepted and completed successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  @ApiResponse({ status: 400, description: 'Transfer cannot be accepted' })
  async accept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<TransferResponseDto> {
    return this.transferService.accept(id, user);
  }

  @Post(':id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel transfer' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({
    status: 200,
    description: 'Transfer cancelled successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  @ApiResponse({ status: 400, description: 'Transfer cannot be cancelled' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<TransferResponseDto> {
    return this.transferService.cancel(id, user);
  }

  @Post(':id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject transfer with reason' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({
    status: 200,
    description: 'Transfer rejected successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  @ApiResponse({ status: 400, description: 'Transfer cannot be rejected' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('rejectionReason') rejectionReason: string,
    @CurrentUser() user: User,
  ): Promise<TransferResponseDto> {
    return this.transferService.reject(id, rejectionReason, user);
  }

  @Post(':id/deliver')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark transfer as delivered' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({
    status: 200,
    description: 'Transfer marked as delivered successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  @ApiResponse({ status: 400, description: 'Transfer cannot be delivered' })
  async deliver(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<TransferResponseDto> {
    return this.transferService.deliver(id, user);
  }

  @Post('request')
  @Roles(UserRole.SHOP_EMPLOYEE, UserRole.MANAGER, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request product transfer when stock is low (shop employees)' })
  @ApiResponse({
    status: 201,
    description: 'Transfer request created successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async requestTransfer(
    @Body() createTransferDto: CreateTransferDto,
    @CurrentUser() user: User,
  ): Promise<TransferResponseDto> {
    return this.transferService.createRequest(createTransferDto, user);
  }
}