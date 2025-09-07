import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CreditType, CreditStatus, CreditRating } from '../enums';

export class CreditQueryDto extends PaginationDto {
  @ApiPropertyOptional({ 
    description: 'Filter by credit type',
    enum: CreditType
  })
  @IsOptional()
  @IsEnum(CreditType)
  type?: CreditType;

  @ApiPropertyOptional({ 
    description: 'Filter by credit status',
    enum: CreditStatus
  })
  @IsOptional()
  @IsEnum(CreditStatus)
  status?: CreditStatus;

  @ApiPropertyOptional({ 
    description: 'Filter by customer ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by credit rating',
    enum: CreditRating
  })
  @IsOptional()
  @IsEnum(CreditRating)
  creditRating?: CreditRating;

  @ApiPropertyOptional({ 
    description: 'Filter by overdue status',
    example: 'true'
  })
  @IsOptional()
  @Type(() => Boolean)
  isOverdue?: boolean;

  @ApiPropertyOptional({ 
    description: 'Filter by due date from',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by due date to',
    example: '2024-12-31'
  })
  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @ApiPropertyOptional({ 
    description: 'Search by credit number or description',
    example: 'AR-12345'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Sort by field',
    example: 'dueDate'
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ 
    description: 'Sort order',
    example: 'DESC'
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}