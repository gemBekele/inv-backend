

import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../../../../common/enums';
import { UpdateUserDto } from './update-user.dto';

export class AdminUpdateUserDto extends UpdateUserDto {
  @ApiPropertyOptional({ 
    enum: UserRole,
    description: 'User role (admin only)' 
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ 
    enum: UserStatus,
    description: 'User status (admin only)' 
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ 
    description: 'Email verification status (admin only)' 
  })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;
}