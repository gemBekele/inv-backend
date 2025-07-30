import { Entity, Column, ManyToMany, OneToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { WarehouseProduct } from './warehouse-product.entity';
import { Company } from '../../company/entities/company.entity';
import { User } from '../../users/entities/user.entity';
import { Shop } from '../../shops/entities/shops.entity';
import { Employee } from '../../users/entities/employee.entity';

@Entity('warehouses')
export class Warehouse extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', nullable: true })
  capacity?: number;

  @OneToMany(() => WarehouseProduct, warehouseProduct => warehouseProduct.warehouse)
  products: WarehouseProduct[];

  @ManyToOne(() => Company, company => company.warehouses, { nullable: false })
  company: Company;

  @ManyToOne(() => User, user => user.warehouses, { nullable: true })
  manager?: User;

  @OneToMany(() => Shop, shop => shop.warehouse)
  shops: Shop[];

  @OneToMany(() => Employee, employee => employee.warehouse)
  employees: Employee[];
}
