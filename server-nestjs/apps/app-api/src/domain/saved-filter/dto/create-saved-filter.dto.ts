import { IsString, IsNotEmpty, IsOptional, IsObject, IsBoolean } from 'class-validator';

export class FilterCriteriaDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  labelIds?: string[];

  @IsOptional()
  @IsString()
  dueDateFrom?: string;

  @IsOptional()
  @IsString()
  dueDateTo?: string;
}

export class CreateSavedFilterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsObject()
  filters: FilterCriteriaDto;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateSavedFilterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  filters?: FilterCriteriaDto;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
