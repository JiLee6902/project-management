import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { StorageService, FileResponseDto } from '@app/external-infra/storage';
import { FileVisibility, FileType } from '@app/entity/enums';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        visibility: { type: 'string', enum: ['public', 'private'], default: 'public' },
        fileType: { type: 'string', enum: ['image', 'document'] },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('visibility') visibility: FileVisibility = FileVisibility.PUBLIC,
    @Body('fileType') fileType: FileType,
    @Request() req: any,
  ): Promise<{ data: FileResponseDto; message: string }> {
    const result = await this.storageService.uploadFile({
      file,
      userId: req.user?.id,
      visibility,
      fileType,
    });

    return {
      data: result,
      message: 'File uploaded successfully',
    };
  }

  @Post('multiple')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        visibility: { type: 'string', enum: ['public', 'private'], default: 'public' },
        fileType: { type: 'string', enum: ['image', 'document'] },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('visibility') visibility: FileVisibility = FileVisibility.PUBLIC,
    @Body('fileType') fileType: FileType,
    @Request() req: any,
  ): Promise<{ data: FileResponseDto[]; message: string }> {
    const results = await this.storageService.uploadMultipleFiles({
      files,
      userId: req.user?.id,
      visibility,
      fileType,
    });

    return {
      data: results,
      message: `${results.length} files uploaded successfully`,
    };
  }

  @Get('file/:fileId')
  async getFile(
    @Param('fileId') fileId: string,
  ): Promise<{ data: FileResponseDto; message: string }> {
    const result = await this.storageService.getFileById(fileId);

    return {
      data: result,
      message: 'File retrieved successfully',
    };
  }

  @Get('file/:fileId/url')
  async getFileUrl(
    @Param('fileId') fileId: string,
  ): Promise<{ data: FileResponseDto; message: string }> {
    const result = await this.storageService.getFileUrl(fileId);

    return {
      data: result,
      message: 'File URL retrieved successfully',
    };
  }

  @Delete('file/:fileId')
  async deleteFile(
    @Param('fileId') fileId: string,
  ): Promise<{ message: string }> {
    await this.storageService.deleteFile(fileId);

    return {
      message: 'File deleted successfully',
    };
  }
}
