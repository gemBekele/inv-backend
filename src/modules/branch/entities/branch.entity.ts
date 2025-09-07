import { Entity, Column, Index, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Company } from '../../company/entities/company.entity';
import { Sales } from '../../sales/entities/sales.entity';

@Entity('branches')
@Index(['name', 'companyId'], { unique: true })
export class Branch extends BaseEntity {
  @ApiProperty({ description: 'Branch name', maxLength: 255 })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'Branch address', maxLength: 255 })
  @Column({ length: 255 })
  address: string;

  @ApiPropertyOptional({ description: 'Phone number', maxLength: 20 })
  @Column({ length: 20, nullable: true })
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @Column({ length: 255, nullable: true })
  email?: string;

  @ApiPropertyOptional({ description: 'Manager name' })
  @Column({ length: 255, nullable: true })
  manager?: string;

  @ApiPropertyOptional({ description: 'Branch description' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Is branch active', default: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Branch metadata' })
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Company ID this branch belongs to' })
  @Column({ type: 'uuid' })
  companyId: string;

  // Relations
  @ManyToOne(() => Company, company => company.branches, { 
    onDelete: 'CASCADE',
    nullable: false 
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @OneToMany(() => Sales, sale => sale.branch, { cascade: true })
  sales?: Sales[];
}
