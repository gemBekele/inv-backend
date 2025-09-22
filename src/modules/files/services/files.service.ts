import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  InternalServerErrorException,
  ForbiddenException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import { File } from '../entities/file.entity';
import { FileUploadDto, FileResponseDto, FileQueryDto, UpdateFileDto } from '../dto';
import { FileType, FileStatus, FileStorageType } from '../enums';
import { defaultFileStorageConfig } from '../config/file-storage.config';
import { User } from '../../users/entities/user.entity';
import { BaseMultiTenantService, MultiTenantUser } from '../../../common/services/base-multi-tenant.service';
import { UserRole } from '../../../common/enums';

@Injectable()
export class FilesService extends BaseMultiTenantService {
  private readonly logger = new Logger(FilesService.name);
  private readonly storageConfig = defaultFileStorageConfig;

  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly configService: ConfigService
  ) {
    super();
  }

  async uploadFile(
    uploadedFile: Express.Multer.File,
    uploadDto: FileUploadDto,
    user: User & MultiTenantUser
  ): Promise<FileResponseDto> {
    try {
      // Validate file
      this.validateFile(uploadedFile);

      // If uploading for a specific entity, validate that entity belongs to user's company
      if (uploadDto.entityId && uploadDto.entityType) {
        await this.validateEntityAccess(uploadDto.entityId, uploadDto.entityType, user);
      }

      // Determine file type
      const fileType = this.determineFileType(uploadedFile.mimetype);

      // Generate unique filename
      const fileName = this.generateUniqueFilename(uploadedFile.originalname);

      // Determine storage path based on entity type
      const storagePath = this.getStoragePath(uploadDto.entityType || 'general');
      const filePath = path.join(storagePath, fileName);
      const fullPath = path.join(this.storageConfig.local.uploadPath, filePath);

      // Ensure directory exists
      await this.ensureDirectoryExists(path.dirname(fullPath));

      // Save file to local storage
      await fs.writeFile(fullPath, uploadedFile.buffer);

      // Calculate file checksum
      const checksum = this.calculateChecksum(uploadedFile.buffer);

      // Create file record with proper company context
      const fileData = {
        originalName: uploadedFile.originalname,
        fileName,
        filePath,
        mimeType: uploadedFile.mimetype,
        size: uploadedFile.size,
        fileType,
        status: FileStatus.ACTIVE,
        storageType: FileStorageType.LOCAL,
        description: uploadDto.description,
        alt: uploadDto.alt,
        entityId: uploadDto.entityId,
        entityType: uploadDto.entityType,
        metadata: uploadDto.metadata || {},
        checksum,
        uploadedById: user.id,
        companyId: undefined as string | undefined // This will be set by setCompanyContext
      };

      // Apply company context for multi-tenancy
      const fileWithCompanyContext = this.setCompanyContext(fileData, user);
      const fileEntity = this.fileRepository.create(fileWithCompanyContext);

      // Generate thumbnail for images
      if (fileType === FileType.IMAGE) {
        try {
          const thumbnailPath = await this.generateThumbnail(fullPath, fileName);
          fileEntity.thumbnailPath = thumbnailPath;
        } catch (error) {
          this.logger.warn(`Failed to generate thumbnail for ${fileName}: ${error.message}`);
        }
      }

      const savedFile = await this.fileRepository.save(fileEntity);

      return this.mapToResponseDto(savedFile);
    } catch (error) {
      this.logger.error(`File upload failed: ${error.message}`, error.stack);
      if (error instanceof Error && error.message.includes('company')) {
        throw new ForbiddenException(error.message);
      }
      throw new InternalServerErrorException('File upload failed');
    }
  }

  async findAll(query: FileQueryDto, user: User & MultiTenantUser): Promise<FileResponseDto[]> {
    const queryBuilder = this.fileRepository
      .createQueryBuilder('file')
      .where('file.status != :deletedStatus', { deletedStatus: FileStatus.DELETED });

    // Apply multi-tenant company filtering
    this.applyCompanyFilter(queryBuilder, user, 'file');

    if (query.fileType) {
      queryBuilder.andWhere('file.fileType = :fileType', { fileType: query.fileType });
    }

    if (query.entityType) {
      queryBuilder.andWhere('file.entityType = :entityType', { entityType: query.entityType });
    }

    if (query.entityId) {
      queryBuilder.andWhere('file.entityId = :entityId', { entityId: query.entityId });
    }

    if (query.status) {
      queryBuilder.andWhere('file.status = :status', { status: query.status });
    }

    if (query.search) {
      queryBuilder.andWhere('(file.originalName ILIKE :search OR file.description ILIKE :search)', {
        search: `%${query.search}%`
      });
    }

    queryBuilder.orderBy('file.createdAt', 'DESC');

    const files = await queryBuilder.getMany();
    return files.map(file => this.mapToResponseDto(file));
  }

  async findOne(id: string, user: User & MultiTenantUser): Promise<FileResponseDto> {
    const queryBuilder = this.fileRepository
      .createQueryBuilder('file')
      .where('file.id = :id', { id })
      .andWhere('file.status = :status', { status: FileStatus.ACTIVE });

    // Apply multi-tenant company filtering
    this.applyCompanyFilter(queryBuilder, user, 'file');

    const file = await queryBuilder.getOne();

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return this.mapToResponseDto(file);
  }

  async findByEntityId(entityId: string, entityType: string, user: User & MultiTenantUser): Promise<FileResponseDto[]> {
    const queryBuilder = this.fileRepository
      .createQueryBuilder('file')
      .where('file.entityId = :entityId', { entityId })
      .andWhere('file.entityType = :entityType', { entityType })
      .andWhere('file.status = :status', { status: FileStatus.ACTIVE })
      .orderBy('file.createdAt', 'DESC');

    // Apply multi-tenant company filtering
    this.applyCompanyFilter(queryBuilder, user, 'file');

    const files = await queryBuilder.getMany();
    return files.map(file => this.mapToResponseDto(file));
  }

  async update(id: string, updateDto: UpdateFileDto, user: User & MultiTenantUser): Promise<FileResponseDto> {
    const queryBuilder = this.fileRepository
      .createQueryBuilder('file')
      .where('file.id = :id', { id });

    // Apply multi-tenant company filtering
    this.applyCompanyFilter(queryBuilder, user, 'file');

    const file = await queryBuilder.getOne();

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Validate company access for file modification
    if (file.companyId && !this.canAccessCompany(user, file.companyId)) {
      throw new ForbiddenException('Access denied: Cannot modify files from other companies');
    }

    // Update allowed fields
    if (updateDto.description !== undefined) file.description = updateDto.description;
    if (updateDto.alt !== undefined) file.alt = updateDto.alt;
    if (updateDto.status !== undefined) file.status = updateDto.status;
    if (updateDto.entityId !== undefined) file.entityId = updateDto.entityId;
    if (updateDto.entityType !== undefined) file.entityType = updateDto.entityType;
    if (updateDto.metadata !== undefined) file.metadata = updateDto.metadata;

    const updatedFile = await this.fileRepository.save(file);
    return this.mapToResponseDto(updatedFile);
  }

  async remove(id: string, user: User & MultiTenantUser): Promise<void> {
    const queryBuilder = this.fileRepository
      .createQueryBuilder('file')
      .where('file.id = :id', { id });

    // Apply multi-tenant company filtering
    this.applyCompanyFilter(queryBuilder, user, 'file');

    const file = await queryBuilder.getOne();

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Validate company access for file deletion
    if (file.companyId && !this.canAccessCompany(user, file.companyId)) {
      throw new ForbiddenException('Access denied: Cannot delete files from other companies');
    }

    // Soft delete by updating status
    file.status = FileStatus.DELETED;
    await this.fileRepository.save(file);

    // Optionally delete physical file (uncomment if needed)
    // try {
    //   const fullPath = path.join(this.storageConfig.local.uploadPath, file.filePath);
    //   await fs.unlink(fullPath);
    //   if (file.thumbnailPath) {
    //     const thumbnailFullPath = path.join(this.storageConfig.local.thumbnailPath, file.thumbnailPath);
    //     await fs.unlink(thumbnailFullPath);
    //   }
    // } catch (error) {
    //   this.logger.warn(`Failed to delete physical file ${file.filePath}: ${error.message}`);
    // }
  }

  async getFileBuffer(id: string, user: User & MultiTenantUser): Promise<{ buffer: Buffer; file: File }> {
    const queryBuilder = this.fileRepository
      .createQueryBuilder('file')
      .where('file.id = :id', { id })
      .andWhere('file.status = :status', { status: FileStatus.ACTIVE });

    // Apply multi-tenant company filtering
    this.applyCompanyFilter(queryBuilder, user, 'file');

    const file = await queryBuilder.getOne();

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Validate company access for file access
    if (file.companyId && !this.canAccessCompany(user, file.companyId)) {
      throw new ForbiddenException('Access denied: Cannot access files from other companies');
    }

    try {
      const fullPath = path.join(this.storageConfig.local.uploadPath, file.filePath);
      const buffer = await fs.readFile(fullPath);
      return { buffer, file };
    } catch (error) {
      this.logger.error(`Failed to read file ${file.filePath}: ${error.message}`);
      throw new NotFoundException('File not found on disk');
    }
  }

  private validateFile(file: Express.Multer.File): void {
    const config = this.storageConfig.local;

    // Check file size
    if (file.size > config.maxFileSize) {
      throw new BadRequestException(`File size exceeds limit of ${config.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check MIME type
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }

    // Check file extension
    const extension = path.extname(file.originalname).toLowerCase();
    if (!config.allowedExtensions.includes(extension)) {
      throw new BadRequestException(`File extension ${extension} is not allowed`);
    }
  }

  private determineFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) {
      return FileType.IMAGE;
    } else if (mimeType === 'application/pdf') {
      return FileType.PDF;
    } else if (mimeType.startsWith('video/')) {
      return FileType.VIDEO;
    } else if (mimeType.startsWith('audio/')) {
      return FileType.AUDIO;
    } else if (mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('text')) {
      return FileType.DOCUMENT;
    } else if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) {
      return FileType.ARCHIVE;
    }
    return FileType.OTHER;
  }

  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${timestamp}_${random}_${sanitizedName}${extension}`;
  }

  private getStoragePath(entityType: string): string {
    return entityType; // This will create folders like 'product/', 'user/', etc.
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private async generateThumbnail(originalPath: string, fileName: string): Promise<string> {
    // For now, return null since we'd need image processing libraries
    // In a real implementation, you'd use sharp, jimp, or similar
    // const thumbnailFileName = `thumb_${fileName}`;
    // const thumbnailPath = path.join(this.storageConfig.local.thumbnailPath, thumbnailFileName);
    // ... image processing logic ...
    // return thumbnailFileName;
    return null;
  }

  /**
   * Validates that the user can access the specified entity
   * This is a simplified validation - in a real app you might want to inject the respective repositories
   */
  private async validateEntityAccess(
    entityId: string, 
    entityType: string, 
    user: User & MultiTenantUser
  ): Promise<void> {
    // Super admins can access any entity
    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // For now, we'll assume entities are company-scoped and trust the validation
    // In a production system, you would inject the relevant repositories and check:
    // - Products: check if product.companyId === user.companyId
    // - Users: check if user.companyId === current_user.companyId
    // - etc.
    
    // This is a placeholder that assumes entity validation is handled by the calling service
    // (e.g., ProductsService validates product ownership before calling file upload)
    this.logger.debug(`Entity access validation for ${entityType}:${entityId} by user:${user.id}`);
  }

  private mapToResponseDto(file: File): FileResponseDto {
    return {
      id: file.id,
      originalName: file.originalName,
      fileName: file.fileName,
      filePath: file.filePath,
      mimeType: file.mimeType,
      size: file.size,
      fileType: file.fileType,
      status: file.status,
      storageType: file.storageType,
      url: file.url,
      thumbnailPath: file.thumbnailPath,
      thumbnailUrl: file.thumbnailUrl,
      entityId: file.entityId,
      entityType: file.entityType,
      description: file.description,
      alt: file.alt,
      metadata: file.metadata,
      checksum: file.checksum,
      companyId: file.companyId,
      uploadedById: file.uploadedById,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      publicUrl: file.publicUrl,
      thumbnailPublicUrl: file.thumbnailPublicUrl,
      isImage: file.isImage,
      isDocument: file.isDocument
    };
  }
}