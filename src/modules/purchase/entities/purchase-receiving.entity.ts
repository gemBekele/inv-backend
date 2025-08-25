import { Entity, Column, ManyToOne, OneToMany, JoinColumn, BeforeInsert, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { User } from '../../users/entities/user.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { PurchaseReceivingItem } from './purchase-receiving-item.entity';
import { ReceivingStatus } from '../enums/purchase.enums';

@Entity('purchase_receivings')
@Index(['receivingNumber'], { unique: true })
@Index(['receivingDate'])
@Index(['status'])
export class PurchaseReceiving extends BaseEntity {
  @Column({ length: 50, unique: true })
  receivingNumber: string;

  @Column({ type: 'date' })
  receivingDate: Date;

  @Column({ type: 'enum', enum: ReceivingStatus, default: ReceivingStatus.PENDING })
  status: ReceivingStatus;

  @Column({ length: 100, nullable: true })
  supplierDeliveryNote?: string;

  @Column({ length: 100, nullable: true })
  carrierName?: string;

  @Column({ length: 100, nullable: true })
  trackingNumber?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  damageNotes?: string;

  @Column({ type: 'boolean', default: false })
  hasDiscrepancies: boolean;

  @Column({ type: 'text', nullable: true })
  discrepancyNotes?: string;

  @Column({ type: 'boolean', default: false })
  qualityControlPassed: boolean;

  @Column({ type: 'text', nullable: true })
  qualityControlNotes?: string;

  @Column({ type: 'json', nullable: true })
  attachments?: string[]; // URLs to receipt documents, photos, etc.

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Relationships
  @ManyToOne(() => PurchaseOrder, purchaseOrder => purchaseOrder.receivings)
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'received_by' })
  receivedBy: User;

  @ManyToOne(() => User, user => user.id, { nullable: true })
  @JoinColumn({ name: 'quality_checked_by' })
  qualityCheckedBy?: User;

  @ManyToOne(() => Warehouse, warehouse => warehouse.id)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @OneToMany(() => PurchaseReceivingItem, item => item.receiving, { cascade: true })
  items: PurchaseReceivingItem[];

  @BeforeInsert()
  setDefaults() {
    if (!this.receivingDate) {
      this.receivingDate = new Date();
    }
    
    if (!this.receivingNumber) {
      this.generateReceivingNumber();
    }
  }

  private generateReceivingNumber() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.receivingNumber = `RCV-${timestamp}-${random}`;
  }

  // Computed properties
  get totalItemsReceived(): number {
    if (!this.items) return 0;
    return this.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
  }

  get totalItemsRejected(): number {
    if (!this.items) return 0;
    return this.items.reduce((sum, item) => sum + (item.rejectedQuantity || 0), 0);
  }

  get isComplete(): boolean {
    return this.status === ReceivingStatus.COMPLETE;
  }

  get needsQualityControl(): boolean {
    return !this.qualityControlPassed && this.items?.some(item => !item.qualityChecked);
  }
}
