import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';
import { Task } from './task.entity';

export enum SprintStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

@Entity('sprints')
export class Sprint extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  goal: string;

  @Column({ name: 'project_id' })
  @Index()
  projectId: string;

  @Column({
    type: 'enum',
    enum: SprintStatus,
    default: SprintStatus.PLANNING,
  })
  status: SprintStatus;

  @Column({ type: 'timestamp', name: 'start_date', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', name: 'end_date', nullable: true })
  endDate: Date;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
