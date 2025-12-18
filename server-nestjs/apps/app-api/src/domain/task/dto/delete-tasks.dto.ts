import { IsArray, IsUUID } from 'class-validator';

export class DeleteTasksDto {
  @IsArray()
  @IsUUID('4', { each: true })
  taskIds: string[];
}
