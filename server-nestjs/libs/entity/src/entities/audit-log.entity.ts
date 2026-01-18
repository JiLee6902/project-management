import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

export enum AuditEntity {
  USER = 'USER',
  WORKSPACE = 'WORKSPACE',
  PROJECT = 'PROJECT',
  TASK = 'TASK',
  COMMENT = 'COMMENT',
  SPRINT = 'SPRINT',
  LABEL = 'LABEL',
  ATTACHMENT = 'ATTACHMENT',
  WEBHOOK = 'WEBHOOK',
  RECURRING_TASK = 'RECURRING_TASK',
}

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['userId', 'createdAt'])
@Index(['workspaceId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId?: string;

  @Column({ name: 'workspace_id', nullable: true })
  @Index()
  workspaceId?: string;

  @Column({ name: 'project_id', nullable: true })
  @Index()
  projectId?: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditEntity,
    name: 'entity_type',
  })
  entityType: AuditEntity;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'entity_name', nullable: true })
  entityName?: string;

  // Store old values before change (for UPDATE/DELETE)
  @Column({ type: 'jsonb', name: 'old_values', nullable: true })
  oldValues?: Record<string, any>;

  // Store new values after change (for CREATE/UPDATE)
  @Column({ type: 'jsonb', name: 'new_values', nullable: true })
  newValues?: Record<string, any>;

  // Store what fields changed
  @Column({ type: 'simple-array', name: 'changed_fields', nullable: true })
  changedFields?: string[];

  // Additional context (IP, user agent, etc.)
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
