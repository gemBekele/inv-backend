import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsNumber, 
  IsBoolean, 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsEmail, 
  Min, 
  Max, 
  MaxLength,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MeasurementSystem {
  METRIC = 'metric',
  IMPERIAL = 'imperial'
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: 'Safety stock threshold for low stock alerts', default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  safetyStockThreshold?: number;

  @ApiPropertyOptional({ description: 'Days before expiry to send reminder', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  expiryReminderDays?: number;

  @ApiPropertyOptional({ description: 'Enable low stock notifications', default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  enableLowStockNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Enable expiry notifications', default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  enableExpiryNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Enable automatic reordering', default: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  autoReorderEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Default tax rate percentage', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  defaultTaxRate?: number;

  @ApiPropertyOptional({ description: 'Default currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  defaultCurrency?: string;

  @ApiPropertyOptional({ description: 'Measurement system', enum: MeasurementSystem, default: MeasurementSystem.METRIC })
  @IsOptional()
  @IsEnum(MeasurementSystem)
  measurementSystem?: MeasurementSystem;

  @ApiPropertyOptional({ description: 'Enable audit logs', default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  enableAuditLogs?: boolean;

  @ApiPropertyOptional({ description: 'Audit log retention in days', default: 365 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  auditLogRetentionDays?: number;

  @ApiPropertyOptional({ description: 'Enable two-factor authentication', default: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  enableTwoFactorAuth?: boolean;

  @ApiPropertyOptional({ description: 'Session timeout in minutes', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Type(() => Number)
  sessionTimeoutMinutes?: number;

  @ApiPropertyOptional({ description: 'Enable caching', default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  enableCaching?: boolean;

  @ApiPropertyOptional({ description: 'Cache expiration in seconds', default: 300 })
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Type(() => Number)
  cacheExpirationSeconds?: number;

  @ApiPropertyOptional({ description: 'Enable email notifications', default: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  enableEmailNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Enable SMS notifications', default: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  enableSmsNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Company name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @ApiPropertyOptional({ description: 'Company address' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyAddress?: string;

  @ApiPropertyOptional({ description: 'Company phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  companyPhone?: string;

  @ApiPropertyOptional({ description: 'Company email address' })
  @IsOptional()
  @IsEmail()
  companyEmail?: string;

  @ApiPropertyOptional({ description: 'Company logo URL or base64 string' })
  @IsOptional()
  @IsString()
  companyLogo?: string;

  @ApiPropertyOptional({ description: 'Notification settings as JSON object' })
  @IsOptional()
  @IsObject()
  notificationSettings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Report settings as JSON object' })
  @IsOptional()
  @IsObject()
  reportSettings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Integration settings as JSON object' })
  @IsOptional()
  @IsObject()
  integrationSettings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Custom settings as JSON object' })
  @IsOptional()
  @IsObject()
  customSettings?: Record<string, any>;
}

export class SettingsResponseDto {
  @ApiProperty({ description: 'Settings ID' })
  id: string;

  @ApiProperty({ description: 'Safety stock threshold for low stock alerts' })
  safetyStockThreshold: number;

  @ApiProperty({ description: 'Days before expiry to send reminder' })
  expiryReminderDays: number;

  @ApiProperty({ description: 'Enable low stock notifications' })
  enableLowStockNotifications: boolean;

  @ApiProperty({ description: 'Enable expiry notifications' })
  enableExpiryNotifications: boolean;

  @ApiProperty({ description: 'Enable automatic reordering' })
  autoReorderEnabled: boolean;

  @ApiProperty({ description: 'Default tax rate percentage' })
  defaultTaxRate: number;

  @ApiProperty({ description: 'Default currency code' })
  defaultCurrency: string;

  @ApiProperty({ description: 'Measurement system', enum: MeasurementSystem })
  measurementSystem: MeasurementSystem;

  @ApiProperty({ description: 'Enable audit logs' })
  enableAuditLogs: boolean;

  @ApiProperty({ description: 'Audit log retention in days' })
  auditLogRetentionDays: number;

  @ApiProperty({ description: 'Enable two-factor authentication' })
  enableTwoFactorAuth: boolean;

  @ApiProperty({ description: 'Session timeout in minutes' })
  sessionTimeoutMinutes: number;

  @ApiProperty({ description: 'Enable caching' })
  enableCaching: boolean;

  @ApiProperty({ description: 'Cache expiration in seconds' })
  cacheExpirationSeconds: number;

  @ApiProperty({ description: 'Enable email notifications' })
  enableEmailNotifications: boolean;

  @ApiProperty({ description: 'Enable SMS notifications' })
  enableSmsNotifications: boolean;

  @ApiPropertyOptional({ description: 'Company name' })
  companyName?: string;

  @ApiPropertyOptional({ description: 'Company address' })
  companyAddress?: string;

  @ApiPropertyOptional({ description: 'Company phone number' })
  companyPhone?: string;

  @ApiPropertyOptional({ description: 'Company email address' })
  companyEmail?: string;

  @ApiPropertyOptional({ description: 'Company logo URL or base64 string' })
  companyLogo?: string;

  @ApiPropertyOptional({ description: 'Notification settings' })
  notificationSettings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Report settings' })
  reportSettings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Integration settings' })
  integrationSettings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Custom settings' })
  customSettings?: Record<string, any>;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
