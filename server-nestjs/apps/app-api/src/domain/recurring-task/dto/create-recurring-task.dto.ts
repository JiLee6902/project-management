import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsInt,
  IsBoolean,
  IsArray,
  IsDateString,
  Min,
  Max,
  ValidateIf,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskType, TaskPriority } from '@app/entity/entities';
import { RecurrencePattern } from '@app/entity/entities/recurring-task.entity';

export class CreateRecurringTaskDto {
  @ApiProperty({ description: 'Task title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Task description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TaskType, default: TaskType.TASK })
  @IsOptional()
  @IsEnum(TaskType)
  taskType?: TaskType;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({ enum: RecurrencePattern })
  @IsEnum(RecurrencePattern)
  pattern: RecurrencePattern;

  @ApiPropertyOptional({ description: 'Cron expression for CUSTOM pattern' })
  @ValidateIf((o) => o.pattern === RecurrencePattern.CUSTOM)
  @IsString()
  @Matches(/^(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)$/, {
    message: 'Invalid cron expression',
  })
  cronExpression?: string;

  @ApiPropertyOptional({ description: 'Days of week (0-6) for WEEKLY pattern', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  daysOfWeek?: number[];

  @ApiPropertyOptional({ description: 'Day of month (1-31) for MONTHLY pattern' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @ApiProperty({ description: 'Start date for recurrence' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'End date for recurrence (optional)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Days until due date from task creation', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  dueDateOffset?: number;

  @ApiPropertyOptional({ description: 'Estimated time in minutes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedTime?: number;

  @ApiPropertyOptional({ description: 'Story points' })
  @IsOptional()
  @IsInt()
  @Min(0)
  storyPoints?: number;

  @ApiPropertyOptional({ description: 'Skip weekends when creating tasks' })
  @IsOptional()
  @IsBoolean()
  skipWeekends?: boolean;

  @ApiPropertyOptional({ description: 'Assignee user ID' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Sprint ID' })
  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @ApiPropertyOptional({ description: 'Label IDs to attach', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  labelIds?: string[];
}
