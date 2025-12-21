import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsUUID()
  taskId: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
