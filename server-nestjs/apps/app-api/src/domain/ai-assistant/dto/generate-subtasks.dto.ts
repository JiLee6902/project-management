import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateSubtasksDto {
  @ApiProperty({ description: 'Title of the task to generate subtasks for' })
  @IsNotEmpty()
  @IsString()
  taskTitle: string;

  @ApiProperty({ description: 'Description of the task to generate subtasks for' })
  @IsNotEmpty()
  @IsString()
  taskDescription: string;
}
