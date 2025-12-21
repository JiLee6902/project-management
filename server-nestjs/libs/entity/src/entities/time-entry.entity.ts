import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Task } from './task.entity';

@Entity('time_entries')
export class TimeEntry extends BaseEntity {
  @Column({ name: 'task_id' })
  @Index()
  taskId: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ type: 'timestamp', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'timestamp', name: 'end_time', nullable: true })
  endTime?: Date;

  @Column({ type: 'int', default: 0 })
  duration: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
