import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { WorkspaceMember } from './workspace-member.entity';
import { Workspace } from './workspace.entity';
import { Project } from './project.entity';
import { ProjectMember } from './project-member.entity';
import { Task } from './task.entity';
import { Comment } from './comment.entity';
import { UserRefreshToken } from './user-refresh-token.entity';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_DELETION = 'PENDING_DELETION',
  DELETED = 'DELETED',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  image: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ name: 'freeze_account_date', nullable: true })
  freezeAccountDate: Date;

  @OneToMany(() => WorkspaceMember, (member) => member.user)
  workspaces: WorkspaceMember[];

  @OneToMany(() => Workspace, (workspace) => workspace.owner)
  ownedWorkspaces: Workspace[];

  @OneToMany(() => Project, (project) => project.owner)
  projects: Project[];

  @OneToMany(() => ProjectMember, (member) => member.user)
  projectMembers: ProjectMember[];

  @OneToMany(() => Task, (task) => task.assignee)
  tasks: Task[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => UserRefreshToken, (token) => token.user)
  refreshTokens: UserRefreshToken[];
}
