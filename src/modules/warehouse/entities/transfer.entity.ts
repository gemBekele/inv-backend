import { Entity, Column, ManyToOne, OneToMany, JoinColumn, BeforeInsert, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Warehouse } from './warehouse.entity';
import { Shop } from '../../shops/entities/shops.entity';
import { User } from '../../users/entities/user.entity';
import { TransferItem } from './transfer-item.entity';
import { TransferType, TransferStatus } from '../enums/transfer.enums';

@Entity('transfers')
@Index(['transferNumber'], { unique: true })
@Index(['status'])
@Index(['type'])
@Index(['createdAt'])
export class Transfer extends BaseEntity {
  @Column({ length: 50, unique: true })
  transferNumber: string;

  @Column({ type: 'enum', enum: TransferType })
  type: TransferType;

  @Column({ type: 'enum', enum: TransferStatus, default: TransferStatus.PENDING })
  status: TransferStatus;

  @Column({ type: 'uuid', nullable: true })
  sourceWarehouseId?: string;

  @Column({ type: 'uuid', nullable: true })
  sourceShopId?: string;

  @Column({ type: 'uuid', nullable: true })
  destinationWarehouseId?: string;

  @Column({ type: 'uuid', nullable: true })
  destinationShopId?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'timestamp', nullable: true })
  expectedDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedDate?: Date;

  @Column({ type: 'uuid' })
  createdById: string;

  @Column({ type: 'uuid', nullable: true })
  approvedById?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Relationships
  @ManyToOne(() => Warehouse, { nullable: true, eager: true })
  @JoinColumn({ name: 'sourceWarehouseId' })
  sourceWarehouse?: Warehouse;

  @ManyToOne(() => Shop, { nullable: true, eager: true })
  @JoinColumn({ name: 'sourceShopId' })
  sourceShop?: Shop;

  @ManyToOne(() => Warehouse, { nullable: true, eager: true })
  @JoinColumn({ name: 'destinationWarehouseId' })
  destinationWarehouse?: Warehouse;

  @ManyToOne(() => Shop, { nullable: true, eager: true })
  @JoinColumn({ name: 'destinationShopId' })
  destinationShop?: Shop;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy?: User;

  @OneToMany(() => TransferItem, item => item.transfer, { eager: true, cascade: true })
  items: TransferItem[];

  @BeforeInsert()
  generateTransferNumber() {
    if (!this.transferNumber) {
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      this.transferNumber = `TRF-${timestamp}-${random}`;
    }
  }

  // Computed properties
  get isCompleted(): boolean {
    return this.status === TransferStatus.COMPLETED;
  }

  get isPending(): boolean {
    return this.status === TransferStatus.PENDING;
  }

  get canBeApproved(): boolean {
    return this.status === TransferStatus.PENDING;
  }

  get canBeCancelled(): boolean {
    return [TransferStatus.PENDING, TransferStatus.IN_TRANSIT].includes(this.status);
  }

  get totalItems(): number {
    return this.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  }

  get itemCount(): number {
    return this.items?.length || 0;
  }
}