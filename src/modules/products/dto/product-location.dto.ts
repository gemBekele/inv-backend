import { ApiProperty } from '@nestjs/swagger';

export class ProductLocationDto {
  @ApiProperty({ description: 'Warehouse locations' })
  warehouses: {
    id: string;
    name: string;
    location: string;
    stockQuantity: number;
    minStockLevel: number;
  }[];

  @ApiProperty({ description: 'Shop locations' })
  shops: {
    id: string;
    name: string;
    location: string;
    stockQuantity: number;
    minStockLevel: number;
  }[];
}