import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from './user.entity';

export enum AutomationTrigger {
  TASK_CREATED = 'task_created',
  TASK_STATUS_CHANGED = 'task_status_changed',
  TASK_ASSIGNED = 'task_assigned',
  TASK_DUE_DATE_APPROACHING = 'task_due_date_approaching',
  TASK_OVERDUE = 'task_overdue',
  SUBTASK_COMPLETED = 'subtask_completed',
  ALL_SUBTASKS_COMPLETED = 'all_subtasks_completed',
}

export enum AutomationAction {
  ASSIGN_USER = 'assign_user',
  CHANGE_STATUS = 'change_status',
  CHANGE_PRIORITY = 'change_priority',
  ADD_LABEL = 'add_label',
  REMOVE_LABEL = 'remove_label',
  SEND_NOTIFICATION = 'send_notification',
  ADD_WATCHER = 'add_watcher',
  MOVE_TO_SPRINT = 'move_to_sprint',
}

@Entity('automation_rules')
export class AutomationRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'project_id' })
  @Index()
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({
    type: 'enum',
    enum: AutomationTrigger,
  })
  trigger: AutomationTrigger;

  @Column({ type: 'json', nullable: true })
  triggerConditions?: {
    status?: string;
    priority?: string;
    type?: string;
    assigneeId?: string;
    labelIds?: string[];
  };

  @Column({
    type: 'enum',
    enum: AutomationAction,
  })
  action: AutomationAction;

  @Column({ type: 'json' })
  actionParams: {
    userId?: string;
    status?: string;
    priority?: string;
    labelId?: string;
    sprintId?: string;
    notificationMessage?: string;
  };

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
