import { Entity, Column, ManyToMany, JoinTable, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Product } from '../../products/entities/product.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { DiscountType } from '../enums';

@Entity('discounts')
export class Discount extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 50, unique: true, nullable: true })
  code?: string;

  @Column({ type: 'enum', enum: DiscountType })
  type: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number; // Percentage or fixed amount

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minimumOrderAmount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maximumDiscountAmount?: number;

  @Column({ type: 'int', nullable: true })
  usageLimit?: number;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  applyToAllProducts: boolean;

  @Column({ type: 'boolean', default: false })
  applyToAllCustomers: boolean;

  @ManyToMany(() => Product, { nullable: true })
  @JoinTable({
    name: 'discount_products',
    joinColumn: { name: 'discount_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' }
  })
  applicableProducts?: Product[];

  @ManyToMany(() => Customer, { nullable: true })
  @JoinTable({
    name: 'discount_customers',
    joinColumn: { name: 'discount_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'customer_id', referencedColumnName: 'id' }
  })
  applicableCustomers?: Customer[];

  // Check if discount is currently valid
  get isValid(): boolean {
    const now = new Date();
    return this.isActive && 
           now >= this.startDate && 
           now <= this.endDate &&
           (!this.usageLimit || this.usageCount < this.usageLimit);
  }
}
