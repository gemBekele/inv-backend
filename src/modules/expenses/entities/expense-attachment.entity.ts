import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Expense } from './expense.entity';

export enum AttachmentType {
  RECEIPT = 'receipt',
  INVOICE = 'invoice',
  PROOF_OF_PAYMENT = 'proof_of_payment',
  CONTRACT = 'contract',
  PHOTO = 'photo',
  DOCUMENT = 'document',
  OTHER = 'other'
}

@Entity('expense_attachments')
export class ExpenseAttachment extends BaseEntity {
  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 255 })
  originalName: string;

  @Column({ type: 'text' })
  filePath: string;

  @Column({ length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ type: 'enum', enum: AttachmentType })
  type: AttachmentType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>; // For storing image dimensions, OCR text, etc.

  // Relationships
  @ManyToOne(() => Expense, expense => expense.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'expense_id' })
  expense: Expense;

  // Computed properties
  get fileSizeInMB(): number {
    return Number(this.fileSize) / (1024 * 1024);
  }

  get isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  get isPdf(): boolean {
    return this.mimeType === 'application/pdf';
  }

  get fileExtension(): string {
    return this.fileName.split('.').pop()?.toLowerCase() || '';
  }
}
