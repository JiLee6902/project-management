import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ActivityType } from '@app/entity/entities';

export class CreateActivityDto {
  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsEnum(ActivityType)
  type: ActivityType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
