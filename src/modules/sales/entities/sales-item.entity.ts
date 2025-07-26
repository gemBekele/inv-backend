import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Sales } from './sales.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('sales_items')
export class SaleItem extends BaseEntity {
  @ManyToOne(() => Sales, sales => sales.items)
  sales: Sales;

  @ManyToOne(() => Product, product => product.id)
  product: Product;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;
}