import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  IMPORT = 'import'
}

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Column({ length: 100 })
  entityType: string; // e.g., 'Sale', 'Product', 'Customer'

  @Column({ type: 'uuid', nullable: true })
  entityId?: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'json', nullable: true })
  oldValues?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  newValues?: Record<string, any>;

  @Column({ length: 255, nullable: true })
  description?: string;

  @Column({ length: 45, nullable: true })
  ipAddress?: string;

  @Column({ length: 500, nullable: true })
  userAgent?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @ManyToOne(() => User, user => user.id, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
