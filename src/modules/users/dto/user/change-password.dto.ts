import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPassword123!' })
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}








