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

export enum WebhookEvent {
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_DELETED = 'task.deleted',
  TASK_STATUS_CHANGED = 'task.status_changed',
  TASK_ASSIGNED = 'task.assigned',
  COMMENT_ADDED = 'comment.added',
  SPRINT_STARTED = 'sprint.started',
  SPRINT_COMPLETED = 'sprint.completed',
  PROJECT_MEMBER_ADDED = 'project.member_added',
  PROJECT_MEMBER_REMOVED = 'project.member_removed',
}

export enum WebhookStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FAILED = 'FAILED', // Too many failures
}

@Entity('webhooks')
export class Webhook extends BaseEntity {
  @Column({ name: 'project_id' })
  @Index()
  projectId: string;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column({ type: 'varchar', nullable: true })
  secret?: string; // For HMAC signature

  @Column({
    type: 'enum',
    enum: WebhookStatus,
    default: WebhookStatus.ACTIVE,
  })
  status: WebhookStatus;

  @Column({ type: 'simple-array' })
  events: WebhookEvent[];

  @Column({ type: 'int', name: 'failure_count', default: 0 })
  failureCount: number;

  @Column({ type: 'timestamp', name: 'last_triggered_at', nullable: true })
  lastTriggeredAt?: Date;

  @Column({ type: 'timestamp', name: 'last_success_at', nullable: true })
  lastSuccessAt?: Date;

  @Column({ type: 'text', name: 'last_error', nullable: true })
  lastError?: string;

  @Column({ name: 'created_by_id' })
  createdById: string;

  // Relations
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by_id' })
  creator: User;
}
