import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SuggestPriorityDto {
  @ApiProperty({ description: 'Title of the task' })
  @IsNotEmpty()
  @IsString()
  taskTitle: string;

  @ApiProperty({ description: 'Description of the task' })
  @IsNotEmpty()
  @IsString()
  taskDescription: string;

  @ApiPropertyOptional({ description: 'Additional project context for better priority assessment' })
  @IsOptional()
  @IsString()
  projectContext?: string;
}
