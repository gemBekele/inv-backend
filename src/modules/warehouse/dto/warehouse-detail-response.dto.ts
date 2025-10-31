import { ApiProperty } from '@nestjs/swagger';
import { WarehouseResponseDto } from './warehouse-response.dto';
import { ProductResponseDto } from '../../products/dto/product-response.dto';

export class WarehouseDetailResponseDto extends WarehouseResponseDto {
  @ApiProperty({
    description: 'Products in the warehouse',
    type: [ProductResponseDto],
  })
  products: ProductResponseDto[];
}
