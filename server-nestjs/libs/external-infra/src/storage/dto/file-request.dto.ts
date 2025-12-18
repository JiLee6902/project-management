import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FileType, FileVisibility } from '@app/entity/enums';

export class BaseFileRequestDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsEnum(FileType)
  @IsOptional()
  fileType?: FileType;

  @IsEnum(FileVisibility)
  @IsOptional()
  visibility?: FileVisibility = FileVisibility.PUBLIC;
}

export class FileRequestDto extends BaseFileRequestDto {
  file: Express.Multer.File;
}

export class FileMultipleRequestDto extends BaseFileRequestDto {
  files: Express.Multer.File[];
}
