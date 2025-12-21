import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';

export class CreateLabelDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color (e.g., #3b82f6)' })
  color: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsString()
  workspaceId: string;
}
