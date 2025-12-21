import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Task } from './task.entity';

export enum ActivityType {
  // Task activities
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_DELETED = 'task_deleted',
  TASK_STATUS_CHANGED = 'task_status_changed',
  TASK_PRIORITY_CHANGED = 'task_priority_changed',
  TASK_ASSIGNEE_CHANGED = 'task_assignee_changed',
  TASK_DUE_DATE_CHANGED = 'task_due_date_changed',

  // Comment activities
  COMMENT_ADDED = 'comment_added',
  COMMENT_UPDATED = 'comment_updated',
  COMMENT_DELETED = 'comment_deleted',

  // Subtask activities
  SUBTASK_ADDED = 'subtask_added',
  SUBTASK_COMPLETED = 'subtask_completed',
  SUBTASK_UNCOMPLETED = 'subtask_uncompleted',

  // Label activities
  LABEL_ADDED = 'label_added',
  LABEL_REMOVED = 'label_removed',

  // Project activities
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_MEMBER_ADDED = 'project_member_added',
  PROJECT_MEMBER_REMOVED = 'project_member_removed',
}

@Entity('activities')
export class Activity extends BaseEntity {
  @Column({ name: 'project_id' })
  @Index()
  projectId: string;

  @Column({ name: 'task_id', nullable: true })
  @Index()
  taskId?: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  type: ActivityType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Relations
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Task, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'task_id' })
  task?: Task;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
