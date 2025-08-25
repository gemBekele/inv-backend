import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { PurchaseReceiving } from './purchase-receiving.entity';
import { PurchaseItem } from './purchase-item.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('purchase_receiving_items')
export class PurchaseReceivingItem extends BaseEntity {
  @Column({ type: 'int' })
  orderedQuantity: number;

  @Column({ type: 'int' })
  receivedQuantity: number;

  @Column({ type: 'int', default: 0 })
  rejectedQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalCost: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'boolean', default: false })
  qualityChecked: boolean;

  @Column({ type: 'boolean', default: true })
  qualityApproved: boolean;

  @Column({ type: 'text', nullable: true })
  qualityNotes?: string;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'json', nullable: true })
  batchInfo?: Record<string, any>; // Batch number, lot number, manufacturing date, etc.

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Relationships
  @ManyToOne(() => PurchaseReceiving, receiving => receiving.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiving_id' })
  receiving: PurchaseReceiving;

  @ManyToOne(() => PurchaseItem, purchaseItem => purchaseItem.id)
  @JoinColumn({ name: 'purchase_item_id' })
  purchaseItem: PurchaseItem;

  @ManyToOne(() => Product, product => product.id, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // Computed properties
  get acceptedQuantity(): number {
    return this.receivedQuantity - this.rejectedQuantity;
  }

  get isFullyReceived(): boolean {
    return this.receivedQuantity >= this.orderedQuantity;
  }

  get isPartiallyReceived(): boolean {
    return this.receivedQuantity > 0 && this.receivedQuantity < this.orderedQuantity;
  }

  get hasRejects(): boolean {
    return this.rejectedQuantity > 0;
  }

  get receivingPercentage(): number {
    if (this.orderedQuantity === 0) return 0;
    return (this.receivedQuantity / this.orderedQuantity) * 100;
  }

  get acceptancePercentage(): number {
    if (this.receivedQuantity === 0) return 0;
    return (this.acceptedQuantity / this.receivedQuantity) * 100;
  }
}
