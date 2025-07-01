import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class BulkImportDto {
  @ApiProperty({ 
	type: 'string', 
	format: 'binary',
	description: 'Excel or CSV file containing products data'
  })
  @IsNotEmpty()
  file: Express.Multer.File;
}