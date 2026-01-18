import { IsEnum, IsUUID, IsOptional, IsBoolean, IsArray, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ImportSource {
  CSV = 'csv',
  JSON = 'json',
  TRELLO = 'trello',
  ASANA = 'asana',
  JIRA = 'jira',
}

export enum ImportEntity {
  TASKS = 'tasks',
  PROJECTS = 'projects',
  USERS = 'users',
}

export class ImportOptionsDto {
  @ApiProperty({ enum: ImportSource })
  @IsEnum(ImportSource)
  source: ImportSource;

  @ApiProperty({ enum: ImportEntity })
  @IsEnum(ImportEntity)
  entity: ImportEntity;

  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  skipDuplicates?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  createLabels?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  assignToCurrentUser?: boolean;
}

export class ColumnMappingDto {
  @ApiProperty({ description: 'CSV/JSON field name' })
  @IsString()
  sourceField: string;

  @ApiProperty({ description: 'Target entity field name' })
  @IsString()
  targetField: string;
}

export class ImportConfigDto extends ImportOptionsDto {
  @ApiPropertyOptional({ type: [ColumnMappingDto] })
  @IsOptional()
  @IsArray()
  columnMapping?: ColumnMappingDto[];
}

export class TrelloImportDto {
  @ApiProperty()
  @IsUUID()
  workspaceId: string;

  @ApiProperty({ description: 'Trello board JSON export' })
  boardData: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  importArchived?: boolean;
}

export class ImportResultDto {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors: ImportErrorDto[];
  summary: ImportSummaryDto;
}

export class ImportErrorDto {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export class ImportSummaryDto {
  totalProcessed: number;
  tasksCreated: number;
  labelsCreated: number;
  projectsCreated: number;
  duration: number;
}

export class ImportPreviewDto {
  headers: string[];
  sampleData: any[];
  suggestedMapping: ColumnMappingDto[];
  totalRows: number;
}
