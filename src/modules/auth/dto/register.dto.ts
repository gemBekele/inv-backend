

import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums';

export class RegisterDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: '+25199999999' })
  @IsOptional()
  @IsString()
  phone?: string;
}


export class AdminCreateUserDto extends RegisterDto {
  @ApiPropertyOptional({ 
    enum: UserRole, 
    example: UserRole.USER,
    description: 'User role (only admins can set this)' 
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Skip email verification (admin only)' 
  })
  @IsOptional()
  skipEmailVerification?: boolean;
}
