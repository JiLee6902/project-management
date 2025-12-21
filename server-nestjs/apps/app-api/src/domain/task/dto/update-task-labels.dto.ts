import { IsArray, IsString, IsOptional } from 'class-validator';

export class UpdateTaskLabelsDto {
  @IsArray()
  @IsString({ each: true })
  labelIds: string[];
}
