import { FileMetadata } from '@app/entity/entities';
import { FileStatus, FileType, FileVisibility } from '@app/entity/enums';

export class FileResponseDto {
  id: string;
  fileKey: string;
  originalName: string;
  mimeType: string;
  size: number;
  formatSize?: string;
  url: string;
  visibility: FileVisibility;
  status: FileStatus;
  fileType: FileType;
  createdAt: Date;

  static toResponse(data: FileMetadata & { url?: string }): FileResponseDto {
    return {
      id: data.id,
      fileKey: data.fileKey,
      originalName: data.originalName,
      mimeType: data.mimeType,
      size: Number(data.size),
      formatSize: FileResponseDto._formatBytes(Number(data.size)),
      url: data.url || '',
      visibility: data.visibility,
      status: data.status,
      fileType: data.fileType,
      createdAt: data.createdAt,
    };
  }

  private static _formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
