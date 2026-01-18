import { IsOptional, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportPeriod {
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
  CUSTOM = 'CUSTOM',
}

export class ReportQueryDto {
  @ApiPropertyOptional({ description: 'Project ID to filter reports' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Sprint ID for burndown chart' })
  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @ApiPropertyOptional({ enum: ReportPeriod, default: ReportPeriod.WEEK })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod = ReportPeriod.WEEK;

  @ApiPropertyOptional({ description: 'Start date for custom period' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for custom period' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
