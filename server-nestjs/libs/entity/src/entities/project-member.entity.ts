import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Role } from './role.entity';

// Project-level role enum
export enum ProjectRole {
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

@Entity('project_members')
@Unique(['userId', 'projectId'])
export class ProjectMember extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'project_id' })
  @Index()
  projectId: string;

  // Simple role field
  @Column({
    type: 'enum',
    enum: ProjectRole,
    default: ProjectRole.MEMBER,
  })
  role: ProjectRole;

  // New RBAC role reference
  @Column({ name: 'role_id', nullable: true })
  @Index()
  roleId: string;

  @ManyToOne(() => User, (user) => user.projectMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Project, (project) => project.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Role, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'role_id' })
  assignedRole: Role;
}
