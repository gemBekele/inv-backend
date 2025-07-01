import { Entity, Column, ManyToMany, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { WarehouseProduct } from './warehouse-product.entity';

@Entity('warehouses')
export class Warehouse extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  location?: string;

  @OneToMany(() => WarehouseProduct, warehouseProduct => warehouseProduct.warehouse)
  products: WarehouseProduct[];
}