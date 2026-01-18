import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RecurringTaskStatus } from '@app/entity/entities/recurring-task.entity';
import { CreateRecurringTaskDto } from './create-recurring-task.dto';

export class UpdateRecurringTaskDto extends PartialType(CreateRecurringTaskDto) {
  @ApiPropertyOptional({ enum: RecurringTaskStatus })
  @IsOptional()
  @IsEnum(RecurringTaskStatus)
  status?: RecurringTaskStatus;
}
