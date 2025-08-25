import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { Product } from '../../products/entities/product.entity';
import { PurchaseItemStatus } from '../enums/purchase.enums';

@Entity('purchase_items')
@Index(['purchaseOrder', 'product'], { unique: true })
export class PurchaseItem extends BaseEntity {
  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  receivedQuantity: number;

  @Column({ type: 'int', default: 0 })
  rejectedQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  actualUnitCost: number; // Cost after receiving (may differ from ordered cost)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  actualTotalCost: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'enum', enum: PurchaseItemStatus, default: PurchaseItemStatus.PENDING })
  status: PurchaseItemStatus;

  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate?: Date;

  @Column({ type: 'date', nullable: true })
  actualDeliveryDate?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  specifications?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Quality control fields
  @Column({ type: 'boolean', default: false })
  qualityChecked: boolean;

  @Column({ type: 'boolean', default: true })
  qualityApproved: boolean;

  @Column({ type: 'text', nullable: true })
  qualityNotes?: string;

  // Relationships
  @ManyToOne(() => PurchaseOrder, purchaseOrder => purchaseOrder.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @ManyToOne(() => Product, product => product.id, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // Computed properties
  get remainingQuantity(): number {
    return this.quantity - this.receivedQuantity - this.rejectedQuantity;
  }

  get isFullyReceived(): boolean {
    return this.receivedQuantity >= this.quantity;
  }

  get isPartiallyReceived(): boolean {
    return this.receivedQuantity > 0 && this.receivedQuantity < this.quantity;
  }

  get receivingPercentage(): number {
    if (this.quantity === 0) return 0;
    return (this.receivedQuantity / this.quantity) * 100;
  }

  get finalUnitCost(): number {
    return this.actualUnitCost > 0 ? this.actualUnitCost : this.unitCost;
  }

  get finalTotalCost(): number {
    return this.actualTotalCost > 0 ? this.actualTotalCost : this.totalCost;
  }

  // Calculate total cost with discounts and taxes
  get netAmount(): number {
    const subtotal = this.finalTotalCost - this.discountAmount;
    return subtotal + this.taxAmount;
  }
}
