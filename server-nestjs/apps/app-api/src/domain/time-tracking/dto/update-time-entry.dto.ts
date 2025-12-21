import { IsOptional, IsDateString, IsNumber, IsString } from 'class-validator';

export class UpdateTimeEntryDto {
  @IsOptional()
  @IsDateString()
  startTime?: string;

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
