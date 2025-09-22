import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  ParseUUIDPipe,
  Res
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiParam,
  ApiBearerAuth
} from '@nestjs/swagger';
import { Response } from 'express';
import { FilesService } from '../services/files.service';
import {
  FileUploadDto,
  FileResponseDto,
  FileQueryDto,
  UpdateFileDto
} from '../dto';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';
import { ResponseDto } from '../../../common/dto';
import { User } from '../../users/entities/user.entity';
import { MultiTenantUser } from '../../../common/services/base-multi-tenant.service';

@ApiTags('Files')
@ApiBearerAuth('access-token')
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'File uploaded successfully',
    type: FileResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or file too large'
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: FileUploadDto,
    @CurrentUser() user: User & MultiTenantUser
  ): Promise<ResponseDto<FileResponseDto>> {
    const uploadedFile = await this.filesService.uploadFile(file, uploadDto, user);
    return {
      success: true,
      message: 'File uploaded successfully',
      data: uploadedFile
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all files with filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Files retrieved successfully'
  })
  async findAll(
    @Query() query: FileQueryDto,
    @CurrentUser() user: User & MultiTenantUser
  ): Promise<ResponseDto<FileResponseDto[]>> {
    const files = await this.filesService.findAll(query, user);
    return {
      success: true,
      message: 'Files retrieved successfully',
      data: files
    };
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get files by entity ID and type' })
  @ApiParam({ name: 'entityType', description: 'Entity type (e.g., product, user)' })
  @ApiParam({ name: 'entityId', description: 'Entity ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Files retrieved successfully'
  })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() user: User & MultiTenantUser
  ): Promise<ResponseDto<FileResponseDto[]>> {
    const files = await this.filesService.findByEntityId(entityId, entityType, user);
    return {
      success: true,
      message: 'Files retrieved successfully',
      data: files
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file metadata by ID' })
  @ApiParam({ name: 'id', description: 'File ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File retrieved successfully',
    type: FileResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found'
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User & MultiTenantUser
  ): Promise<ResponseDto<FileResponseDto>> {
    const file = await this.filesService.findOne(id, user);
    return {
      success: true,
      message: 'File retrieved successfully',
      data: file
    };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download file by ID' })
  @ApiParam({ name: 'id', description: 'File ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File downloaded successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found'
  })
  async downloadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User & MultiTenantUser,
    @Res() res: Response
  ): Promise<void> {
    const { buffer, file } = await this.filesService.getFileBuffer(id, user);
    
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': file.size.toString(),
      'Content-Disposition': `attachment; filename="${file.originalName}"`
    });
    
    res.send(buffer);
  }

  @Get(':id/view')
  @ApiOperation({ summary: 'View file by ID (inline)' })
  @ApiParam({ name: 'id', description: 'File ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File viewed successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found'
  })
  async viewFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User & MultiTenantUser,
    @Res() res: Response
  ): Promise<void> {
    const { buffer, file } = await this.filesService.getFileBuffer(id, user);
    
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': file.size.toString(),
      'Content-Disposition': `inline; filename="${file.originalName}"`
    });
    
    res.send(buffer);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update file metadata' })
  @ApiParam({ name: 'id', description: 'File ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File updated successfully',
    type: FileResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found'
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateFileDto,
    @CurrentUser() user: User & MultiTenantUser
  ): Promise<ResponseDto<FileResponseDto>> {
    const file = await this.filesService.update(id, updateDto, user);
    return {
      success: true,
      message: 'File updated successfully',
      data: file
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete file' })
  @ApiParam({ name: 'id', description: 'File ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File deleted successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found'
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User & MultiTenantUser
  ): Promise<ResponseDto<null>> {
    await this.filesService.remove(id, user);
    return {
      success: true,
      message: 'File deleted successfully',
      data: null
    };
  }
}