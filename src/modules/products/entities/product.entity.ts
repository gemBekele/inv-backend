import { Column, Entity, Index, BeforeInsert, BeforeUpdate, JoinTable, ManyToMany, OneToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { ProductType } from '../enums/product-type.enum';
import { ProductStatus } from '../enums/product-status.enum';
import { WarehouseProduct } from '../..//warehouse/entities/warehouse-product.entity';
import { Commission } from '../../commission/entities/commission.entity';
import { User } from '../../users/entities/user.entity';

@Entity('products')
@Index(['sku'], { unique: true })
@Index(['barcode'], { unique: true, where: 'barcode IS NOT NULL' })
export class Product extends BaseEntity {
  @Column({ type: 'enum', enum: ProductType })
  type: ProductType;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 100, unique: true })
  sku: string;

  @Column({ length: 100, nullable: true, unique: true })
  barcode?: string;

  @Column({ length: 100 })
  category: string;

  @Column({ length: 50 })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  commissionRate: number; // Commission rate in percent, e.g. 5 for 5%

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cost: number;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.AVAILABLE })
  status: ProductStatus;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  imageUrl?: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ type: 'boolean', default: true })
  trackStock: boolean;

  @Column({ type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ type: 'int', default: 0 })
  minStockLevel: number;

  @ManyToOne(() => User, { nullable: true })
  createdBy?: User;

   @OneToMany(() => WarehouseProduct, warehouseProduct => warehouseProduct.product)
  warehouseProducts: WarehouseProduct[];

  @OneToMany(() => Commission, commission => commission.product)
  commission: Commission[];

  // Auto-generate SKU if not provided
  @BeforeInsert()
  @BeforeUpdate()
  generateSku() {
    if (!this.sku) {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 5);
      this.sku = `PRD-${timestamp}-${random}`.toUpperCase();
    }
  }

  // Auto-generate barcode for products if not provided
  @BeforeInsert()
  generateBarcode() {
    if (this.type === ProductType.PRODUCT && !this.barcode) {
      // Generate a simple barcode (in production, use a proper barcode generator)
      const timestamp = Date.now();
      this.barcode = `${timestamp}${Math.floor(Math.random() * 1000)}`;
    }
  }

  // Calculate profit margin
  get profitMargin(): number {
    if (this.cost === 0) return 0;
    return ((this.price - this.cost) / this.cost) * 100;
  }


  get calculatedIsExpired(): boolean {
    if (!this.expiryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(this.expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return today > expiry;
  }
}