import { Entity, Column, ManyToOne, OneToMany, BeforeInsert } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { SaleItem } from './sales-item.entity';
import { Commission } from '../../commission/entities/commission.entity';
import { PaymentType, SaleStatus } from '../enums';

@Entity('sales')
export class Sales extends BaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  advancePayment: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  remainingBalance: number;

  @Column({ type: 'date' })
  saleDate: Date;

  @Column({ type: 'enum', enum: PaymentType })
  paymentType: PaymentType;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.PENDING })
  status: SaleStatus;

  @Column({ length: 255, nullable: true })
  note?: string;

  @ManyToOne(() => Customer, customer => customer.id)
  customer: Customer;

  @ManyToOne(() => Warehouse, warehouse => warehouse.id)
  warehouse: Warehouse;

  @OneToMany(() => SaleItem, saleItem => saleItem.sales)
  items: SaleItem[];

  @OneToMany(() => Commission, commission => commission.sale)
  commissions: Commission[];

  @BeforeInsert()
  setDefaultDate() {
    if (!this.saleDate) {
      this.saleDate = new Date();
    }
  }
}