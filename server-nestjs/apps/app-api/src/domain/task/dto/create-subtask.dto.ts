import { IsString, IsOptional, IsBoolean, MaxLength, IsInt, Min } from 'class-validator';

export class CreateSubtaskDto {
  @IsString()
  taskId: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
