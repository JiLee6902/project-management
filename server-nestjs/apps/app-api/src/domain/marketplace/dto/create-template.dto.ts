import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateCategory, TemplateType } from '@app/entity/entities';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Template description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: TemplateCategory, description: 'Template category' })
  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @ApiProperty({ enum: TemplateType, description: 'Template type' })
  @IsEnum(TemplateType)
  type: TemplateType;

  @ApiProperty({ description: 'Template data structure' })
  @IsObject()
  @IsNotEmpty()
  templateData: Record<string, any>;

  @ApiPropertyOptional({ description: 'Whether the template is public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Tags for the template', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Workspace ID to scope the template' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}
