import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsArray, IsEmail, IsNumber } from 'class-validator';
import { ProjectStatus, Priority } from '@app/entity/entities';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @IsDateString()
  @IsOptional()
  endDate?: Date;

  @IsUUID()
  workspaceId: string;

  @IsString()
  @IsOptional()
  teamLeadEmail?: string;

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  teamMembers?: string[];

  @IsNumber()
  @IsOptional()
  progress?: number;
}
