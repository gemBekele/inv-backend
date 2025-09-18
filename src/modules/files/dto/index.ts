import { IsOptional, IsString, IsEnum, IsUUID, IsJSON } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType, FileStatus, FileStorageType, FileEntityType } from '../enums';

export class FileUploadDto {
  @ApiPropertyOptional({ description: 'Description of the file' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Alt text for images' })
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiPropertyOptional({ description: 'ID of the entity this file is associated with' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ 
    description: 'Type of entity this file is associated with',
    enum: FileEntityType 
  })
  @IsOptional()
  @IsEnum(FileEntityType)
  entityType?: FileEntityType;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsJSON()
  metadata?: Record<string, any>;
}

export class FileResponseDto {
  @ApiProperty({ description: 'File ID' })
  id: string;

  @ApiProperty({ description: 'Original file name' })
  originalName: string;

  @ApiProperty({ description: 'Stored file name' })
  fileName: string;

  @ApiProperty({ description: 'File path' })
  filePath: string;

  @ApiProperty({ description: 'MIME type' })
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'File type', enum: FileType })
  fileType: FileType;

  @ApiProperty({ description: 'File status', enum: FileStatus })
  status: FileStatus;

  @ApiProperty({ description: 'Storage type', enum: FileStorageType })
  storageType: FileStorageType;

  @ApiPropertyOptional({ description: 'Public URL' })
  url?: string;

  @ApiPropertyOptional({ description: 'Thumbnail path' })
  thumbnailPath?: string;

  @ApiPropertyOptional({ description: 'Public thumbnail URL' })
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Entity ID' })
  entityId?: string;

  @ApiPropertyOptional({ description: 'Entity type' })
  entityType?: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Alt text' })
  alt?: string;

  @ApiProperty({ description: 'Metadata' })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'File checksum' })
  checksum?: string;

  @ApiProperty({ description: 'Company ID' })
  companyId?: string;

  @ApiProperty({ description: 'Uploaded by user ID' })
  uploadedById: string;

  @ApiProperty({ description: 'Upload date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Public URL for accessing the file' })
  publicUrl: string;

  @ApiPropertyOptional({ description: 'Public thumbnail URL' })
  thumbnailPublicUrl?: string;

  @ApiProperty({ description: 'Whether the file is an image' })
  isImage: boolean;

  @ApiProperty({ description: 'Whether the file is a document' })
  isDocument: boolean;
}

export class FileQueryDto {
  @ApiPropertyOptional({ description: 'Filter by file type', enum: FileType })
  @IsOptional()
  @IsEnum(FileType)
  fileType?: FileType;

  @ApiPropertyOptional({ description: 'Filter by entity type', enum: FileEntityType })
  @IsOptional()
  @IsEnum(FileEntityType)
  entityType?: FileEntityType;

  @ApiPropertyOptional({ description: 'Filter by entity ID' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: FileStatus })
  @IsOptional()
  @IsEnum(FileStatus)
  status?: FileStatus;

  @ApiPropertyOptional({ description: 'Search by filename' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateFileDto {
  @ApiPropertyOptional({ description: 'Description of the file' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Alt text for images' })
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiPropertyOptional({ description: 'File status', enum: FileStatus })
  @IsOptional()
  @IsEnum(FileStatus)
  status?: FileStatus;

  @ApiPropertyOptional({ description: 'ID of the entity this file is associated with' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ 
    description: 'Type of entity this file is associated with',
    enum: FileEntityType 
  })
  @IsOptional()
  @IsEnum(FileEntityType)
  entityType?: FileEntityType;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}