import { Entity, Column, ManyToMany, OneToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { WarehouseProduct } from './warehouse-product.entity';
import { Company } from '../../company/entities/company.entity';
import { User } from '../../users/entities/user.entity';
import { Shop } from '../../shops/entities/shops.entity';

@Entity('warehouses')
export class Warehouse extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  location?: string;

  @OneToMany(() => WarehouseProduct, warehouseProduct => warehouseProduct.warehouse)
  products: WarehouseProduct[];

  @ManyToOne(() => Company, company => company.warehouses)
  company: Company;

  @ManyToOne(() => Shop, shop => shop.warehouse)
  shop: Shop;

  @OneToMany(() => User, user => user.warehouses)
  employees: User[];
}