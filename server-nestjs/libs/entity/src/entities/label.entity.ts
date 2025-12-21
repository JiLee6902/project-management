import { Entity, Column, ManyToOne, ManyToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Workspace } from './workspace.entity';
import { Task } from './task.entity';

export const LABEL_COLORS = [
  '#ef4444', 
  '#f97316', 
  '#f59e0b', 
  '#eab308', 
  '#84cc16', 
  '#22c55e', 
  '#14b8a6', 
  '#06b6d4', 
  '#0ea5e9', 
  '#3b82f6', 
  '#6366f1', 
  '#8b5cf6', 
  '#a855f7', 
  '#d946ef', 
  '#ec4899', 
  '#78716c', 
] as const;

@Entity('labels')
export class Label extends BaseEntity {
  @Column({ name: 'workspace_id' })
  @Index()
  workspaceId: string;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 7, default: '#3b82f6' }) 
  color: string;

  @Column({ nullable: true, length: 200 })
  description: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToMany(() => Task, (task) => task.labels)
  tasks: Task[];
}
