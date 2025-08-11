import { Entity, Column, Index, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('product_groups')
@Index(['name'], { unique: true })
export class ProductGroup extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 10, nullable: true })
  code?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  defaultCommissionRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  defaultTaxRate: number;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Many-to-many relationship with products
  @ManyToMany(() => Product, { cascade: true })
  @JoinTable({
    name: 'product_group_products',
    joinColumn: { name: 'group_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' }
  })
  products: Product[];
}
