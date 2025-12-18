import { IsString, IsEnum, IsOptional, IsEmail } from 'class-validator';
import { WorkspaceRole } from '@app/entity/entities';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(WorkspaceRole)
  @IsOptional()
  role?: WorkspaceRole;

  @IsString()
  @IsOptional()
  message?: string;
}
