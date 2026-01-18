import {
  Entity,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Permission } from './permission.entity';
import { Workspace } from './workspace.entity';

/**
 * Scope where the role applies
 */
export enum RoleScope {
  SYSTEM = 'SYSTEM',       // System-wide roles (super admin)
  WORKSPACE = 'WORKSPACE', // Workspace-level roles
  PROJECT = 'PROJECT',     // Project-level roles
}

/**
 * Default role types
 */
export enum DefaultRole {
  // System roles
  SUPER_ADMIN = 'SUPER_ADMIN',

  // Workspace roles
  WORKSPACE_OWNER = 'WORKSPACE_OWNER',
  WORKSPACE_ADMIN = 'WORKSPACE_ADMIN',
  WORKSPACE_MEMBER = 'WORKSPACE_MEMBER',
  WORKSPACE_GUEST = 'WORKSPACE_GUEST',

  // Project roles
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  PROJECT_MEMBER = 'PROJECT_MEMBER',
  PROJECT_VIEWER = 'PROJECT_VIEWER',
}

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ length: 100 })
  @Index()
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: RoleScope,
    default: RoleScope.WORKSPACE,
  })
  @Index()
  scope: RoleScope;

  @Column({ name: 'workspace_id', nullable: true })
  @Index()
  workspaceId: string; // null = system role, not null = custom workspace role

  @Column({ type: 'boolean', default: false, name: 'is_default' })
  isDefault: boolean; // Default system roles cannot be deleted

  @Column({ type: 'int', default: 0 })
  priority: number; // Higher = more privileges (for hierarchy)

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToMany(() => Permission, (permission) => permission.roles, { eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];
}
