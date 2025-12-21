import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';

export class UpdateLabelDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color (e.g., #3b82f6)' })
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}
