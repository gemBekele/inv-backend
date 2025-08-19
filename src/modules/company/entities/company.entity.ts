import { BaseEntity } from '../../../database/entities/base.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { Shop } from '../../shops/entities/shops.entity';
import { Entity, Column, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Employee } from '../../users/entities/employee.entity';

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

  @OneToMany(() => Shop, shop => shop.company, {eager: true})
  shops: Shop[];

  @OneToMany(() => User, user => user.company)
  users: User[];

  @OneToMany(() => Employee, employee => employee.company)
  employees: Employee[];
}