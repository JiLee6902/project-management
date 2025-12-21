import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Task } from './task.entity';
import { User } from './user.entity';

export enum DependencyType {
  BLOCKS = 'blocks',           // This task blocks another
  BLOCKED_BY = 'blocked_by',   // This task is blocked by another
  RELATES_TO = 'relates_to',   // Related tasks
  DUPLICATES = 'duplicates',   // Duplicate of another task
}

@Entity('task_dependencies')
@Unique(['taskId', 'dependsOnTaskId'])
export class TaskDependency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id' })
  taskId: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'depends_on_task_id' })
  dependsOnTaskId: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'depends_on_task_id' })
  dependsOnTask: Task;

  @Column({
    type: 'enum',
    enum: DependencyType,
    default: DependencyType.BLOCKED_BY,
  })
  type: DependencyType;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
