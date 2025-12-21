import { IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateTimeEntryDto {
  @IsString()
  taskId: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
