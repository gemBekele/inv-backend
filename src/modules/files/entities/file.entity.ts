import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { FileType, FileStatus, FileStorageType } from '../enums';
import { User } from '../../users/entities/user.entity';
import { Company } from '../../company/entities/company.entity';

@Entity('files')
@Index(['entityId', 'entityType'])
@Index(['fileType'])
@Index(['status'])
export class File extends BaseEntity {
  @Column({ length: 255 })
  originalName: string;

  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 500 })
  filePath: string;

  @Column({ length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ type: 'enum', enum: FileType })
  fileType: FileType;

  @Column({ type: 'enum', enum: FileStatus, default: FileStatus.ACTIVE })
  status: FileStatus;

  @Column({ type: 'enum', enum: FileStorageType, default: FileStorageType.LOCAL })
  storageType: FileStorageType;

  @Column({ length: 500, nullable: true })
  url?: string;

  @Column({ length: 500, nullable: true })
  thumbnailPath?: string;

  @Column({ length: 500, nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'uuid', nullable: true })
  entityId?: string; // ID of the entity this file is associated with (e.g., product ID)

  @Column({ length: 100, nullable: true })
  entityType?: string; // Type of entity (e.g., 'product', 'user', 'company')

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  alt?: string; // Alt text for images

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>; // Additional metadata like dimensions, exif data, etc.

  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum?: string; // File hash for integrity checking

  @Column({ type: 'uuid', nullable: true })
  companyId?: string;

  @Column({ type: 'uuid' })
  uploadedById: string;

  // Relations
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  company?: Company;

  // Computed properties
  get isImage(): boolean {
    return this.fileType === FileType.IMAGE;
  }

  get isDocument(): boolean {
    return [FileType.PDF, FileType.DOCUMENT].includes(this.fileType);
  }

  get publicUrl(): string {
    if (this.storageType === FileStorageType.S3 || this.storageType === FileStorageType.MINIO) {
      return this.url || '';
    }
    // For local storage, construct URL based on file path
    return `/uploads/${this.filePath}`;
  }

  get thumbnailPublicUrl(): string | null {
    if (!this.thumbnailPath) return null;
    
    if (this.storageType === FileStorageType.S3 || this.storageType === FileStorageType.MINIO) {
      return this.thumbnailUrl || null;
    }
    // For local storage, construct thumbnail URL
    return `/uploads/thumbnails/${this.thumbnailPath}`;
  }
}