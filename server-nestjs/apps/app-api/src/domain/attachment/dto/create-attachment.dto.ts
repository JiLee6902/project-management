import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateAttachmentDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;
}

export class AttachmentResponseDto {
  id: string;
  taskId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
}
