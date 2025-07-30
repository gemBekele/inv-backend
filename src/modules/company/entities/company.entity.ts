import { BaseEntity } from '../../../database/entities/base.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { Entity, Column, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('companies')
export class Company extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  address: string;

  @Column({ length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ length: 255, nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => Warehouse, warehouse => warehouse.company, {eager: true})
  warehouses: Warehouse[];
}