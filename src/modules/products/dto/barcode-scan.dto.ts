import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class BarcodeScanDto {
  @ApiProperty({ 
	description: 'Scanned barcode value',
	example: '1234567890123'
  })
  @IsString()
  @IsNotEmpty()
  barcode: string;
}