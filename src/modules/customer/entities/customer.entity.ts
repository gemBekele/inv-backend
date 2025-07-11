import { Entity, Column, Index, OneToMany, BeforeInsert } from 'typeorm';
import { CustomerStatus } from '../enums/customer-status.enum';
import { BaseEntity } from '../../../database/entities';
// import { CustomerStatus } from './enums/customer-status.enum';
// import { Order } from '../orders/entities/order.entity';
// import { Sale } from '../sales/entities/sale.entity';

@Entity('customers')
@Index(['phoneNumber'], { unique: true })
export class Customer extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ length: 10 })
  phoneNumber: string;

  @Column({ length: 255, nullable: true })
  address?: string;

  @Column({ type: 'enum', enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  status: CustomerStatus;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // @Column({ type: 'int', default: 0 })
  // loyaltyPoints: number;

  // @OneToMany(() => Order, order => order.customer)
  // orders: Order[];

  // @OneToMany(() => Sale, sale => sale.customer)
  // sales: Sale[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  normalizePhone() {
    if (this.phoneNumber) {
      this.phoneNumber = this.phoneNumber.replace(/\D/g, '').trim();
    }
  }
}