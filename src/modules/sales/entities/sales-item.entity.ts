import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Sales } from './sales.entity';
import { Product } from '../../products/entities/product.entity';
import { Discount } from './discount.entity';

@Entity('sales_items')
export class SaleItem extends BaseEntity {
  @ManyToOne(() => Sales, sales => sales.items)
  @JoinColumn({ name: 'sales_id' })
  sales: Sales;

  @ManyToOne(() => Product, product => product.id)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @ManyToOne(() => Discount, { nullable: true })
  @JoinColumn({ name: 'discount_id' })
  appliedDiscount?: Discount;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Calculate line total including tax and discount
  get lineTotal(): number {
    return this.subtotal - this.discountAmount + this.taxAmount;
  }
}
