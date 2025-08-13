import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Shop } from './shops.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('shop_products')
@Unique(['shop', 'product'])
export class ShopProduct extends BaseEntity {
  @ApiProperty({ description: 'Stock quantity in shop' })
  @Column({ default: 0 })
  stockQuantity: number;

  @ApiProperty({ description: 'Minimum stock level' })
  @Column({ default: 0 })
  minStockLevel: number;

  @ApiProperty({ description: 'Sales quantity' })
  @Column({ default: 0 })
  salesQuantity: number;

  @ApiProperty({ description: 'Sales revenue' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  salesRevenue: number;

  @ApiProperty({ description: 'Last sale date' })
  @Column({ type: 'date', nullable: true })
  lastSaleDate?: Date;

  @ManyToOne(() => Shop, shop => shop.products)
  @JoinColumn({ name: 'shopId' })
  shop: Shop;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;
}