import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Workspace } from './workspace.entity';
import { TaskType, TaskPriority } from './task.entity';

@Entity('task_templates')
export class TaskTemplate extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'workspace_id' })
  @Index()
  workspaceId: string;

  @Column({
    type: 'enum',
    enum: TaskType,
    default: TaskType.TASK,
  })
  type: TaskType;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({ type: 'int', name: 'estimated_time', default: 0 })
  estimatedTime: number;

  @Column({ type: 'int', name: 'story_points', nullable: true })
  storyPoints: number;

  @Column({ type: 'json', nullable: true })
  subtasks: { title: string }[];

  @Column({ type: 'json', nullable: true })
  checklist: { title: string }[];

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;
}
