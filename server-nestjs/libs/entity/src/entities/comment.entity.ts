import { Entity, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Task } from './task.entity';

@Entity('comments')
export class Comment extends BaseEntity {
  @Column('text')
  content: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'task_id' })
  @Index()
  taskId: string;

  @Column({ name: 'parent_id', nullable: true })
  @Index()
  parentId?: string;

  // Relations
  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Task, (task) => task.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => Comment, (comment) => comment.replies, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies?: Comment[];
}
