import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImproveDescriptionDto {
  @ApiProperty({ description: 'Title of the task' })
  @IsNotEmpty()
  @IsString()
  taskTitle: string;

  @ApiPropertyOptional({ description: 'Current task description to improve' })
  @IsOptional()
  @IsString()
  currentDescription?: string;
}
