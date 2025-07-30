import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { Company } from '../../company/entities/company.entity';
import { Sales } from '../../sales/entities/sales.entity';
import { Employee } from '../../users/entities/employee.entity';

@Entity('shops')
export class Shop extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  location?: string;

  @OneToMany(() => Employee, employee => employee.shop)
  employees: Employee[];

  @ManyToOne(() => Warehouse, warehouse => warehouse.shops)
  warehouse: Warehouse;

  @ManyToOne(() => Company, company => company.id)
  company: Company;

  @OneToMany(() => Sales, sale => sale.shop)
  sales: Sales[];
}