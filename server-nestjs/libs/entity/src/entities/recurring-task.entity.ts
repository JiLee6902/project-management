import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';
import { User } from './user.entity';
import { TaskPriority, TaskType } from './task.entity';

export enum RecurrencePattern {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

export enum RecurringTaskStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

@Entity('recurring_tasks')
export class RecurringTask extends BaseEntity {
  @Column({ name: 'project_id' })
  @Index()
  projectId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TaskType,
    default: TaskType.TASK,
  })
  taskType: TaskType;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({
    type: 'enum',
    enum: RecurrencePattern,
    default: RecurrencePattern.WEEKLY,
  })
  pattern: RecurrencePattern;

  // For CUSTOM pattern: cron expression (e.g., "0 9 * * 1" = Every Monday at 9 AM)
  @Column({ type: 'varchar', name: 'cron_expression', nullable: true })
  cronExpression?: string;

  // Days of week for WEEKLY pattern (0=Sunday, 1=Monday, etc.)
  @Column({ type: 'simple-array', name: 'days_of_week', nullable: true })
  daysOfWeek?: number[];

  // Day of month for MONTHLY pattern (1-31)
  @Column({ type: 'int', name: 'day_of_month', nullable: true })
  dayOfMonth?: number;

  @Column({
    type: 'enum',
    enum: RecurringTaskStatus,
    default: RecurringTaskStatus.ACTIVE,
  })
  status: RecurringTaskStatus;

  @Column({ type: 'timestamp', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'timestamp', name: 'end_date', nullable: true })
  endDate?: Date;

  // Due date offset in days from creation
  @Column({ type: 'int', name: 'due_date_offset', default: 0 })
  dueDateOffset: number;

  @Column({ type: 'int', name: 'estimated_time', nullable: true })
  estimatedTime?: number;

  @Column({ type: 'int', name: 'story_points', nullable: true })
  storyPoints?: number;

  // Skip weekends when creating tasks
  @Column({ type: 'boolean', name: 'skip_weekends', default: false })
  skipWeekends: boolean;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId?: string;

  @Column({ name: 'sprint_id', nullable: true })
  sprintId?: string;

  // Labels to attach (stored as JSON array of label IDs)
  @Column({ type: 'simple-array', name: 'label_ids', nullable: true })
  labelIds?: string[];

  @Column({ type: 'timestamp', name: 'last_generated_at', nullable: true })
  lastGeneratedAt?: Date;

  @Column({ type: 'timestamp', name: 'next_generation_at', nullable: true })
  nextGenerationAt?: Date;

  @Column({ type: 'int', name: 'tasks_generated', default: 0 })
  tasksGenerated: number;

  // Relations
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee?: User;
}
