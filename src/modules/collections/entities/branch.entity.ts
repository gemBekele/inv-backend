import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Sales } from '../../sales/entities/sales.entity';

@Entity('branches')
@Index(['name'], { unique: true })
export class Branch extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  address: string;

  @Column({ length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ length: 255, nullable: true })
  email?: string;

  @Column({ length: 255, nullable: true })
  manager?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Relations
  @OneToMany(() => Sales, sale => sale.branch, { nullable: true })
  sales?: Sales[];
}
