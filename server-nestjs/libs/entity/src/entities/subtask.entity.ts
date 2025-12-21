import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Task } from './task.entity';

@Entity('subtasks')
export class Subtask extends BaseEntity {
  @Column({ name: 'task_id' })
  @Index()
  taskId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ type: 'int', default: 0 })
  position: number;

  @ManyToOne(() => Task, (task) => task.subtasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;
}
