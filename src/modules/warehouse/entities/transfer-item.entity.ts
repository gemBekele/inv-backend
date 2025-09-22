import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Transfer } from './transfer.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('transfer_items')
export class TransferItem extends BaseEntity {
  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid' })
  transferId: string;

  @Column({ type: 'uuid' })
  productId: string;

  // Relationships
  @ManyToOne(() => Transfer, transfer => transfer.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transferId' })
  transfer: Transfer;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'productId' })
  product: Product;
}