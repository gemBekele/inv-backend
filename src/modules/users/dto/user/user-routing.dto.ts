import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserRoutingDto {
  @ApiPropertyOptional({ description: 'Company ID for routing' })
  companyId?: string;

  @ApiPropertyOptional({ description: 'Shop ID for routing' })
  shopId?: string;

  @ApiPropertyOptional({ description: 'Warehouse ID for routing' })
  warehouseId?: string;
}