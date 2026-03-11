import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EstimateTimeDto {
  @ApiProperty({ description: 'Title of the task' })
  @IsNotEmpty()
  @IsString()
  taskTitle: string;

  @ApiProperty({ description: 'Description of the task' })
  @IsNotEmpty()
  @IsString()
  taskDescription: string;

  @ApiPropertyOptional({ description: 'List of subtask titles for more accurate estimation', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subtasks?: string[];
}
