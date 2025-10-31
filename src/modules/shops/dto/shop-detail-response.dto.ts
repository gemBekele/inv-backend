import { ApiProperty } from '@nestjs/swagger';
import { ShopResponseDto } from './shop-response.dto';
import { ProductResponseDto } from '@/modules/products/dto';

export class ShopDetailResponseDto extends ShopResponseDto {
  @ApiProperty({
    description: 'Products in the shop',
    type: [ProductResponseDto],
  })
  products: ProductResponseDto[];
}
