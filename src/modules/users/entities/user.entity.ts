import { Entity, Column, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { BaseEntity } from '../../../database/entities/base.entity';
import { UserRole, UserStatus } from '../../../common/enums';

@Entity('users')
@Index(['email'], { unique: true })
export class User extends BaseEntity {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @Column({ unique: true, length: 255 })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @Column({ length: 100 })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @Column({ length: 100 })
  lastName: string;

  @Exclude()
  @Column()
  password: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.USER,
  })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
  })
  @Column({ nullable: true, length: 20 })
  phone?: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @Column({ nullable: true, length: 500 })
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Email verification timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Column({ nullable: true, type: 'timestamp with time zone' })
  emailVerifiedAt?: Date;

  @ApiPropertyOptional({
    description: 'User email verification status',
    example: true,
  })
  @Column({ default: false })
  isEmailVerified: boolean;

  @ApiPropertyOptional({
    description: 'Last login timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Column({ nullable: true, type: 'timestamp with time zone' })
  lastLoginAt?: Date;

  @Exclude()
  @Column({ nullable: true })
  refreshToken?: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      this.password = await bcrypt.hash(this.password, rounds);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  @BeforeInsert()
  @BeforeUpdate()
  emailToLowerCase() {
    this.email = this.email.toLowerCase();
  }
}