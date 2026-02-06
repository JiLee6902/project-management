import { Entity, Column, ManyToOne, OneToMany, ManyToMany, JoinTable, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Comment } from './comment.entity';
import { Label } from './label.entity';
import { Subtask } from './subtask.entity';
import { TimeEntry } from './time-entry.entity';
import { Sprint } from './sprint.entity';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CLOSED = 'CLOSED',
  REOPEN = 'REOPEN',
}

export enum TaskType {
  TASK = 'TASK',
  BUG = 'BUG',
  FEATURE = 'FEATURE',
  IMPROVEMENT = 'IMPROVEMENT',
  OTHER = 'OTHER',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Entity('tasks')
export class Task extends BaseEntity {
  @Column({ name: 'project_id' })
  @Index()
  projectId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

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

  @Column({ name: 'assignee_id', nullable: true })
  @Index()
  assigneeId: string;

  @Column({ type: 'timestamp', nullable: true, name: 'due_date' })
  dueDate: Date;

  @Column({ type: 'int', name: 'estimated_time', default: 0 })
  estimatedTime: number;

  @Column({ type: 'int', name: 'logged_time', default: 0 })
  loggedTime: number;

  @Column({ type: 'int', name: 'story_points', nullable: true })
  storyPoints: number;

  @Column({ name: 'parent_task_id', nullable: true })
  @Index()
  parentTaskId: string;

  @Column({ type: 'boolean', name: 'is_recurring', default: false })
  isRecurring: boolean;

  @Column({ type: 'varchar', name: 'recurrence_pattern', nullable: true })
  recurrencePattern: string; // DAILY, WEEKLY, MONTHLY, CUSTOM

  @Column({ type: 'timestamp', name: 'recurrence_end_date', nullable: true })
  recurrenceEndDate: Date;

  @Column({ name: 'sprint_id', nullable: true })
  @Index()
  sprintId: string;

  @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;

  @OneToMany(() => Comment, (comment) => comment.task)
  comments: Comment[];

  @ManyToMany(() => Label, (label) => label.tasks)
  @JoinTable({
    name: 'task_labels',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'label_id', referencedColumnName: 'id' },
  })
  labels: Label[];

  @OneToMany(() => Subtask, (subtask) => subtask.task)
  subtasks: Subtask[];

  @OneToMany(() => TimeEntry, (timeEntry) => timeEntry.task)
  timeEntries: TimeEntry[];

  @ManyToOne(() => Sprint, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint;
}
