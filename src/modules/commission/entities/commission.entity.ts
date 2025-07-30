import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { Sales } from '../../sales/entities/sales.entity';
import { Employee } from '../../users/entities/employee.entity';

@Entity('commissions')
export class Commission extends BaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  commissionDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  commissionRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  commissionAmount: number;

  @ManyToOne(() => Sales, sale => sale.commissions)
  sale: Sales;

  @ManyToOne(() => Product, product => product.commission)
  product: Product;

  @ManyToOne(() => Employee, employee => employee.commissions)
  employee: Employee;
}
