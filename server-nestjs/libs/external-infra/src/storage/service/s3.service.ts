import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import s3Config from '../config/s3.config';
import { FileRequestDto, FileMultipleRequestDto } from '../dto';
import { FileType, FileVisibility } from '@app/entity/enums';

interface ValidationResult {
  isValid: boolean;
  errorKey?: string;
}

interface UploadResult {
  fileKey: string;
  url: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;

  constructor(
    @Inject(s3Config.KEY)
    private readonly config: ConfigType<typeof s3Config>,
  ) {
    this.s3Client = new S3Client({
      region: this.config.region,
      credentials:
        this.config.accessKeyId && this.config.secretAccessKey
          ? {
              accessKeyId: this.config.accessKeyId,
              secretAccessKey: this.config.secretAccessKey,
            }
          : undefined,
    });
  }

  async uploadFile(request: FileRequestDto): Promise<UploadResult> {
    const { file, visibility = FileVisibility.PUBLIC, fileType } = request;

    const detectedFileType = fileType || this._detectFileType(file.mimetype);
    const validation = this.validateFile(file, detectedFileType);

    if (!validation.isValid) {
      throw new BadRequestException(validation.errorKey);
    }

    const fileKey = this._generateFileKey(file, visibility, detectedFileType);

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
      Metadata: {
        originalName: Buffer.from(file.originalname).toString('base64'),
      },
    });

    await this.s3Client.send(command);

    const url = `${this.config.publicUrlBase}/${fileKey}`;

    this.logger.log(`File uploaded successfully: ${fileKey}`);

    return { fileKey, url };
  }

  async uploadMultipleFiles(
    request: FileMultipleRequestDto,
  ): Promise<Array<UploadResult & { originalName: string }>> {
    const { files, visibility, fileType } = request;

    const validation = this.validateMultipleFiles(files, fileType);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errorKey);
    }

    const uploadPromises = files.map((file) =>
      this.uploadFile({ ...request, file, visibility, fileType }).then(
        (result) => ({
          ...result,
          originalName: file.originalname,
        }),
      ),
    );

    const results = await Promise.allSettled(uploadPromises);

    return results
      .filter(
        (result): result is PromiseFulfilledResult<UploadResult & { originalName: string }> =>
          result.status === 'fulfilled',
      )
      .map((result) => result.value);
  }

  async deleteFile(fileKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: fileKey,
    });

    await this.s3Client.send(command);
    this.logger.log(`File deleted successfully: ${fileKey}`);
  }

  validateFile(file: Express.Multer.File, fileType?: FileType): ValidationResult {
    const detectedType = fileType || this._detectFileType(file.mimetype);
    const allowedMimeTypes = this.config.allowedMimeTypes[detectedType];
    const maxFileSize = this.config.maxFileSize[detectedType];

    if (!allowedMimeTypes?.includes(file.mimetype)) {
      return {
        isValid: false,
        errorKey: `Invalid file type. Allowed types for ${detectedType}: ${allowedMimeTypes?.join(', ')}`,
      };
    }

    if (file.size > maxFileSize) {
      return {
        isValid: false,
        errorKey: `File size exceeds limit. Max size for ${detectedType}: ${maxFileSize / 1024 / 1024}MB`,
      };
    }

    return { isValid: true };
  }

  validateMultipleFiles(
    files: Express.Multer.File[],
    fileType?: FileType,
  ): ValidationResult {
    if (files.length > this.config.maxFilesPerUpload) {
      return {
        isValid: false,
        errorKey: `Too many files. Maximum allowed: ${this.config.maxFilesPerUpload}`,
      };
    }

    for (const file of files) {
      const validation = this.validateFile(file, fileType);
      if (!validation.isValid) {
        return validation;
      }
    }

    return { isValid: true };
  }

  getPublicUrl(fileKey: string): string {
    return `${this.config.publicUrlBase}/${fileKey}`;
  }

  private _generateFileKey(
    file: Express.Multer.File,
    visibility: FileVisibility,
    fileType: FileType,
  ): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const extension = file.originalname.split('.').pop()?.toLowerCase() || 'bin';
    const folder = fileType === FileType.IMAGE ? 'images' : 'documents';

    return `${visibility}/${folder}/${timestamp}-${uuid}.${extension}`;
  }

  private _detectFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) {
      return FileType.IMAGE;
    }
    return FileType.DOCUMENT;
  }
}
