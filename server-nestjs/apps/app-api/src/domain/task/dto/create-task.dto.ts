import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsUrl } from 'class-validator';
import { TaskStatus, TaskType, TaskPriority } from '@app/entity/entities';

export class CreateTaskDto {
  @IsUUID()
  projectId: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsString()
  @IsOptional()
  origin?: string;
}
