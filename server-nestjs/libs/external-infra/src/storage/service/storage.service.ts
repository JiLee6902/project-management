import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileMetadata } from '@app/entity/entities';
import { FileStatus, FileType, FileVisibility } from '@app/entity/enums';
import { S3Service } from './s3.service';
import { FileRequestDto, FileMultipleRequestDto, FileResponseDto } from '../dto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly s3Service: S3Service,
    @InjectRepository(FileMetadata)
    private readonly fileMetadataRepository: Repository<FileMetadata>,
  ) {}

  async uploadFile(request: FileRequestDto): Promise<FileResponseDto> {
    const { file, userId, visibility = FileVisibility.PUBLIC, fileType } = request;

    const detectedFileType = fileType || this._detectFileType(file.mimetype);

    const { fileKey, url } = await this.s3Service.uploadFile({
      file,
      userId,
      visibility,
      fileType: detectedFileType,
    });

    const metadata = await this._createMetadata({
      fileKey,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      visibility,
      fileType: detectedFileType,
      userId,
      url,
    });

    return FileResponseDto.toResponse(metadata);
  }

  async uploadMultipleFiles(
    request: FileMultipleRequestDto,
  ): Promise<FileResponseDto[]> {
    const { files, userId, visibility = FileVisibility.PUBLIC, fileType } = request;

    const results: FileResponseDto[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadFile({
          file,
          userId,
          visibility,
          fileType,
        });
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to upload file: ${file.originalname}`, error);
      }
    }

    return results;
  }

  async getFileUrl(fileId: string): Promise<FileResponseDto> {
    const metadata = await this._getFileMetadata(fileId);
    const url = this.s3Service.getPublicUrl(metadata.fileKey);

    return FileResponseDto.toResponse({ ...metadata, url });
  }

  async getFileById(fileId: string): Promise<FileResponseDto> {
    const metadata = await this._getFileMetadata(fileId);
    return FileResponseDto.toResponse(metadata);
  }

  async deleteFile(fileId: string): Promise<void> {
    const metadata = await this._getFileMetadata(fileId);

    await this.s3Service.deleteFile(metadata.fileKey);

    await this.fileMetadataRepository.update(fileId, {
      status: FileStatus.FAILED,
      deletedAt: new Date(),
    });

    this.logger.log(`File deleted: ${fileId}`);
  }

  async deleteMultipleFiles(fileIds: string[]): Promise<void> {
    const deletePromises = fileIds.map((id) => this.deleteFile(id));
    await Promise.allSettled(deletePromises);
  }

  private async _getFileMetadata(fileId: string): Promise<FileMetadata> {
    const metadata = await this.fileMetadataRepository.findOne({
      where: { id: fileId },
    });

    if (!metadata) {
      throw new NotFoundException(`File not found: ${fileId}`);
    }

    return metadata;
  }

  private async _createMetadata(data: {
    fileKey: string;
    originalName: string;
    mimeType: string;
    size: number;
    visibility: FileVisibility;
    fileType: FileType;
    userId?: string;
    url: string;
  }): Promise<FileMetadata> {
    const metadata = this.fileMetadataRepository.create({
      ...data,
      status: FileStatus.UPLOADED,
    });

    return this.fileMetadataRepository.save(metadata);
  }

  private _detectFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) {
      return FileType.IMAGE;
    }
    return FileType.DOCUMENT;
  }
}
