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

  @Column({ type: 'enum', enum: TransferStatus, default: TransferStatus.REQUESTED })
  status: TransferStatus;

  @Column({ type: 'uuid' })
  sourceLocationId: string;

  @Column({ type: 'enum', enum: ['warehouse', 'shop'] })
  sourceLocationType: 'warehouse' | 'shop';

  @Column({ type: 'uuid' })
  destinationLocationId: string;

  @Column({ type: 'enum', enum: ['warehouse', 'shop'] })
  destinationLocationType: 'warehouse' | 'shop';

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'timestamp', nullable: true })
  expectedDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  acceptedDate?: Date;

  @Column({ type: 'uuid' })
  createdById: string;

  @Column({ type: 'uuid', nullable: true })
  approvedById?: string;

  @Column({ type: 'uuid', nullable: true })
  deliveredById?: string;

  @Column({ type: 'uuid', nullable: true })
  acceptedById?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Relationships - removed conflicting relationships since we now use sourceLocationType/destinationLocationType

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy?: User;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'deliveredById' })
  deliveredBy?: User;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'acceptedById' })
  acceptedBy?: User;

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

  get isRequested(): boolean {
    return this.status === TransferStatus.REQUESTED;
  }

  get canBeApproved(): boolean {
    return this.status === TransferStatus.REQUESTED;
  }

  get canBeDelivered(): boolean {
    return this.status === TransferStatus.APPROVED || this.status === TransferStatus.IN_TRANSIT;
  }

  get canBeAccepted(): boolean {
    return this.status === TransferStatus.DELIVERED;
  }

  get canBeCancelled(): boolean {
    return [TransferStatus.REQUESTED, TransferStatus.APPROVED, TransferStatus.IN_TRANSIT].includes(this.status);
  }

  get totalItems(): number {
    return this.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  }

  get itemCount(): number {
    return this.items?.length || 0;
  }
}