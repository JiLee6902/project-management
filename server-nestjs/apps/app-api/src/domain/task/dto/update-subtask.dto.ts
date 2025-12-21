import { IsString, IsOptional, IsBoolean, MaxLength, IsInt, Min } from 'class-validator';

export class UpdateSubtaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class ReorderSubtasksDto {
  @IsString({ each: true })
  subtaskIds: string[];
}
