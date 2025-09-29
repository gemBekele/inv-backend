import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('staff_permissions')
export class StaffPermissions extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'jsonb', default: {} })
  featureAccess: {
    manageItem: boolean;
    manageAttribute: boolean;
    managePartner: boolean;
    manageLocation: boolean;
    stockIn: boolean;
    stockOut: boolean;
    adjust: boolean;
    moveStock: boolean;
    manageStockInDraft: boolean;
    manageStockOutDraft: boolean;
  };

  @Column({ type: 'jsonb', default: {} })
  itemAttributeAccess: {
    type: boolean;
    brand: boolean;
  };
}