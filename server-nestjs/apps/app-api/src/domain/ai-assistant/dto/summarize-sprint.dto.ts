import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SprintTaskDto {
  @ApiProperty({ description: 'Task title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Task status (e.g. TODO, IN_PROGRESS, DONE)' })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({ description: 'Assignee name' })
  @IsOptional()
  @IsString()
  assignee?: string;
}

export class SummarizeSprintDto {
  @ApiProperty({ description: 'List of tasks in the sprint', type: [SprintTaskDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SprintTaskDto)
  tasks: SprintTaskDto[];
}
