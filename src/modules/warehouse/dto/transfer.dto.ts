import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID, IsNumber, IsOptional, IsString, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TransferType, TransferStatus } from '../enums/transfer.enums';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateTransferItemDto {
  @ApiProperty({ description: 'Product ID to transfer' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Quantity to transfer', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Notes for this item' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateTransferDto {
  @ApiProperty({ 
    description: 'Type of transfer',
    enum: TransferType 
  })
  @IsEnum(TransferType)
  type: TransferType;

  @ApiPropertyOptional({ description: 'Source warehouse ID' })
  @IsUUID()
  @IsOptional()
  sourceWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Source shop ID' })
  @IsUUID()
  @IsOptional()
  sourceShopId?: string;

  @ApiPropertyOptional({ description: 'Destination warehouse ID' })
  @IsUUID()
  @IsOptional()
  destinationWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Destination shop ID' })
  @IsUUID()
  @IsOptional()
  destinationShopId?: string;

  @ApiProperty({ 
    description: 'Items to transfer',
    type: [CreateTransferItemDto] 
  })
  @ValidateNested({ each: true })
  @Type(() => CreateTransferItemDto)
  items: CreateTransferItemDto[];

  @ApiPropertyOptional({ description: 'Transfer notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Expected completion date' })
  @IsOptional()
  expectedDate?: Date;
}

export class UpdateTransferDto {
  @ApiPropertyOptional({ 
    description: 'Transfer status',
    enum: TransferStatus 
  })
  @IsEnum(TransferStatus)
  @IsOptional()
  status?: TransferStatus;

  @ApiPropertyOptional({ description: 'Transfer notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Rejection reason (if status is rejected)' })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class TransferItemResponseDto {
  @ApiProperty({ description: 'Transfer item ID' })
  id: string;

  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Product name' })
  productName: string;

  @ApiProperty({ description: 'Product SKU' })
  productSku?: string;

  @ApiProperty({ description: 'Quantity to transfer' })
  quantity: number;

  @ApiProperty({ description: 'Notes for this item' })
  notes?: string;
}

export class TransferResponseDto {
  @ApiProperty({ description: 'Transfer ID' })
  id: string;

  @ApiProperty({ description: 'Transfer number' })
  transferNumber: string;

  @ApiProperty({ 
    description: 'Transfer type',
    enum: TransferType 
  })
  type: TransferType;

  @ApiProperty({ 
    description: 'Transfer status',
    enum: TransferStatus 
  })
  status: TransferStatus;

  @ApiProperty({ description: 'Source warehouse name' })
  sourceWarehouseName?: string;

  @ApiProperty({ description: 'Source warehouse ID' })
  sourceWarehouseId?: string;

  @ApiProperty({ description: 'Source shop name' })
  sourceShopName?: string;

  @ApiProperty({ description: 'Source shop ID' })
  sourceShopId?: string;

  @ApiProperty({ description: 'Destination warehouse name' })
  destinationWarehouseName?: string;

  @ApiProperty({ description: 'Destination warehouse ID' })
  destinationWarehouseId?: string;

  @ApiProperty({ description: 'Destination shop name' })
  destinationShopName?: string;

  @ApiProperty({ description: 'Destination shop ID' })
  destinationShopId?: string;

  @ApiProperty({ 
    description: 'Transfer items',
    type: [TransferItemResponseDto] 
  })
  items: TransferItemResponseDto[];

  @ApiProperty({ description: 'Transfer notes' })
  notes?: string;

  @ApiProperty({ description: 'Rejection reason' })
  rejectionReason?: string;

  @ApiProperty({ description: 'Expected completion date' })
  expectedDate?: Date;

  @ApiProperty({ description: 'Actual completion date' })
  completedDate?: Date;

  @ApiProperty({ description: 'Created by user name' })
  createdByName: string;

  @ApiProperty({ description: 'Created by user ID' })
  createdById: string;

  @ApiProperty({ description: 'Approved by user name' })
  approvedByName?: string;

  @ApiProperty({ description: 'Approved by user ID' })
  approvedById?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: Date;
}

export class TransferQueryDto extends PaginationDto {
  @ApiPropertyOptional({ 
    description: 'Filter by transfer type',
    enum: TransferType 
  })
  @IsEnum(TransferType)
  @IsOptional()
  type?: TransferType;

  @ApiPropertyOptional({ 
    description: 'Filter by status',
    enum: TransferStatus 
  })
  @IsEnum(TransferStatus)
  @IsOptional()
  status?: TransferStatus;

  @ApiPropertyOptional({ description: 'Filter by source warehouse ID' })
  @IsUUID()
  @IsOptional()
  sourceWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Filter by destination warehouse ID' })
  @IsUUID()
  @IsOptional()
  destinationWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Filter by source shop ID' })
  @IsUUID()
  @IsOptional()
  sourceShopId?: string;

  @ApiPropertyOptional({ description: 'Filter by destination shop ID' })
  @IsUUID()
  @IsOptional()
  destinationShopId?: string;

  @ApiPropertyOptional({ description: 'Search by transfer number or notes' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by created date from' })
  @IsOptional()
  createdFrom?: Date;

  @ApiPropertyOptional({ description: 'Filter by created date to' })
  @IsOptional()
  createdTo?: Date;
}