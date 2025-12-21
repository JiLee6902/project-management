import { IsString, IsOptional, IsDateString, IsArray, IsUUID } from 'class-validator';

export class CreateSprintDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsUUID()
  projectId: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class UpdateSprintDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class AddTasksToSprintDto {
  @IsArray()
  @IsUUID('4', { each: true })
  taskIds: string[];
}
