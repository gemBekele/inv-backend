import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';

@Entity('settings')
export class Settings extends BaseEntity {
  @Column({ type: 'int', default: 5 })
  safetyStockThreshold: number;

  @Column({ type: 'int', default: 30 })
  expiryReminderDays: number;

  @Column({ type: 'boolean', default: true })
  enableLowStockNotifications: boolean;

  @Column({ type: 'boolean', default: true })
  enableExpiryNotifications: boolean;

  @Column({ type: 'boolean', default: false })
  autoReorderEnabled: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  defaultTaxRate: number;

  @Column({ length: 10, default: 'USD' })
  defaultCurrency: string;

  @Column({ type: 'enum', enum: ['metric', 'imperial'], default: 'metric' })
  measurementSystem: 'metric' | 'imperial';

  @Column({ type: 'boolean', default: true })
  enableAuditLogs: boolean;

  @Column({ type: 'int', default: 365 })
  auditLogRetentionDays: number;

  @Column({ type: 'boolean', default: false })
  enableTwoFactorAuth: boolean;

  @Column({ type: 'int', default: 30 })
  sessionTimeoutMinutes: number;

  @Column({ type: 'boolean', default: true })
  enableCaching: boolean;

  @Column({ type: 'int', default: 300 })
  cacheExpirationSeconds: number;

  @Column({ type: 'boolean', default: false })
  enableEmailNotifications: boolean;

  @Column({ type: 'boolean', default: false })
  enableSmsNotifications: boolean;

  @Column({ length: 255, nullable: true })
  companyName?: string;

  @Column({ length: 255, nullable: true })
  companyAddress?: string;

  @Column({ length: 20, nullable: true })
  companyPhone?: string;

  @Column({ length: 255, nullable: true })
  companyEmail?: string;

  @Column({ type: 'text', nullable: true })
  companyLogo?: string;

  @Column({ type: 'json', nullable: true })
  notificationSettings?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  reportSettings?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  integrationSettings?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  customSettings?: Record<string, any>;
}
