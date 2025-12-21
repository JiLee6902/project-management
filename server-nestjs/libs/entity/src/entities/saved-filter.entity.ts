import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Project } from './project.entity';

@Entity('saved_filters')
export class SavedFilter extends BaseEntity {
  @Column()
  name: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'project_id', nullable: true })
  @Index()
  projectId: string;

  @Column({ type: 'json' })
  filters: {
    status?: string;
    type?: string;
    priority?: string;
    assigneeId?: string;
    labelIds?: string[];
    dueDateFrom?: string;
    dueDateTo?: string;
  };

  @Column({ type: 'boolean', name: 'is_default', default: false })
  isDefault: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
