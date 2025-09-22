import { Entity, Column, Index, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Company } from '../../company/entities/company.entity';
import { SupplierStatus } from '../enums/supplier-status.enum';

@Entity('suppliers')
@Index(['name', 'companyId'], { unique: true })
@Index(['email', 'companyId'], { unique: true, where: 'email IS NOT NULL' })
export class Supplier extends BaseEntity {
  @ApiProperty({ description: 'Supplier name', maxLength: 255 })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'Contact number', maxLength: 20 })
  @Column({ length: 20 })
  contact: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @Column({ length: 255, nullable: true })
  email?: string;

  @ApiPropertyOptional({ description: 'Supplier address' })
  @Column({ length: 255, nullable: true })
  address?: string;

  @ApiPropertyOptional({ description: 'Contact person name' })
  @Column({ length: 255, nullable: true })
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Tax identification number' })
  @Column({ length: 100, nullable: true })
  taxNumber?: string;

  @ApiPropertyOptional({ description: 'Supplier description' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Supplier status', enum: SupplierStatus, default: SupplierStatus.ACTIVE })
  @Column({ 
    type: 'enum', 
    enum: SupplierStatus, 
    default: SupplierStatus.ACTIVE 
  })
  status: SupplierStatus;

  @ApiProperty({ description: 'Credit limit', default: 0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  creditLimit: number;

  @ApiProperty({ description: 'Payment terms in days', default: 30 })
  @Column({ type: 'int', default: 30 })
  paymentTermsDays: number;

  @ApiPropertyOptional({ description: 'Bank details' })
  @Column({ type: 'json', nullable: true })
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    swiftCode?: string;
  };

  @ApiPropertyOptional({ description: 'Emergency contact information' })
  @Column({ type: 'json', nullable: true })
  emergencyContact?: {
    name?: string;
    phone?: string;
    email?: string;
  };

  @ApiPropertyOptional({ description: 'Supplier metadata' })
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Company ID this supplier belongs to' })
  @Column({ type: 'uuid', nullable: true })
  companyId?: string;

  // Relations
  @ManyToOne(() => Company, company => company.suppliers, { 
    onDelete: 'CASCADE',
    nullable: true 
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  // You can add purchase orders relation here when implemented
  // @OneToMany(() => PurchaseOrder, purchaseOrder => purchaseOrder.supplier)
  // purchaseOrders?: PurchaseOrder[];

  // Computed properties
  get isActive(): boolean {
    return this.status === SupplierStatus.ACTIVE;
  }

  get isBlacklisted(): boolean {
    return this.status === SupplierStatus.BLACKLISTED;
  }
}
