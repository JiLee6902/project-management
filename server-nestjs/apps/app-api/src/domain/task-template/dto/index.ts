import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsUUID } from 'class-validator';
import { TaskType, TaskPriority } from '@app/entity/entities';

export class CreateTaskTemplateDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  workspaceId: string;

  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsNumber()
  @IsOptional()
  estimatedTime?: number;

  @IsNumber()
  @IsOptional()
  storyPoints?: number;

  @IsArray()
  @IsOptional()
  subtasks?: { title: string }[];

  @IsArray()
  @IsOptional()
  checklist?: { title: string }[];
}

export class UpdateTaskTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsNumber()
  @IsOptional()
  estimatedTime?: number;

  @IsNumber()
  @IsOptional()
  storyPoints?: number;

  @IsArray()
  @IsOptional()
  subtasks?: { title: string }[];

  @IsArray()
  @IsOptional()
  checklist?: { title: string }[];
}
