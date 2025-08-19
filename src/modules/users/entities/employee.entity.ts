import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { User } from './user.entity';
import { Shop } from '../../shops/entities/shops.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { Company } from '../../company/entities/company.entity';
import { Commission } from '../../commission/entities/commission.entity';

@Entity('employees')
export class Employee extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ length: 20 })
  phoneNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  baseCommissionRate: number;

  @Column({ length: 255, nullable: true })
  jobTitle?: string;

  @ManyToOne(() => User, user => user.employees)
  user: User;

  @ManyToOne(() => Company, company => company.employees)
  company: Company;

  @ManyToOne(() => Shop, shop => shop.employees)
  shop: Shop;

  @ManyToOne(() => Warehouse, warehouse => warehouse.employees)
  warehouse: Warehouse;

  @OneToMany(() => Commission, commission => commission.employee)
  commissions: Commission[];
}