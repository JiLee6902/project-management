import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Workspace } from './workspace.entity';
import { Role } from './role.entity';

// Keep legacy enum for backward compatibility
export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
}

@Entity('workspace_members')
@Unique(['userId', 'workspaceId'])
export class WorkspaceMember extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'workspace_id' })
  @Index()
  workspaceId: string;

  @Column({ nullable: true })
  message: string;

  // Legacy role field - kept for backward compatibility
  @Column({
    type: 'enum',
    enum: WorkspaceRole,
    default: WorkspaceRole.MEMBER,
  })
  role: WorkspaceRole;

  // New RBAC role reference
  @Column({ name: 'role_id', nullable: true })
  @Index()
  roleId: string;

  @ManyToOne(() => User, (user) => user.workspaces, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Workspace, (workspace) => workspace.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => Role, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'role_id' })
  assignedRole: Role;
}
