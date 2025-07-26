import { Entity, ManyToOne, Column, Unique } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Warehouse } from './warehouse.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('warehouse_products')
@Unique(['warehouse', 'product'])
export class WarehouseProduct extends BaseEntity {
  @ManyToOne(() => Warehouse, warehouse => warehouse.products)
  warehouse: Warehouse;

  @ManyToOne(() => Product, product => product.warehouseProducts)
  product: Product;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ type: 'int', default: 0 })
  minStockLevel: number;
  
  @Column({ type: 'int', default: 0 })
  salesQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  salesRevenue: number;

  @Column({ type: 'date', nullable: true })
  lastSaleDate?: Date;
}