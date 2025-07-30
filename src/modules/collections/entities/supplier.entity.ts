import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';

@Entity('suppliers')
@Index(['name'], { unique: true })
@Index(['email'], { unique: true, where: 'email IS NOT NULL' })
export class Supplier extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ length: 20 })
  contact: string;

  @Column({ length: 255, nullable: true })
  email?: string;

  @Column({ length: 255, nullable: true })
  address?: string;

  @Column({ length: 255, nullable: true })
  contactPerson?: string;

  @Column({ length: 100, nullable: true })
  taxNumber?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ['active', 'inactive', 'blacklisted'], default: 'active' })
  status: 'active' | 'inactive' | 'blacklisted';

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  creditLimit: number;

  @Column({ type: 'int', default: 30 })
  paymentTermsDays: number;

  @Column({ type: 'json', nullable: true })
  bankDetails?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // You can add purchase orders relation here when implemented
  // @OneToMany(() => PurchaseOrder, purchaseOrder => purchaseOrder.supplier)
  // purchaseOrders?: PurchaseOrder[];
}
