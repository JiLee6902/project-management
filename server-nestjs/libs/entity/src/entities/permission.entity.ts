import { Entity, Column, ManyToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Role } from './role.entity';

/**
 * Resource types that can have permissions
 */
export enum ResourceType {
  WORKSPACE = 'WORKSPACE',
  PROJECT = 'PROJECT',
  TASK = 'TASK',
  COMMENT = 'COMMENT',
  MEMBER = 'MEMBER',
  LABEL = 'LABEL',
  SPRINT = 'SPRINT',
  REPORT = 'REPORT',
  WEBHOOK = 'WEBHOOK',
  SETTINGS = 'SETTINGS',
}

/**
 * Actions that can be performed on resources
 */
export enum ActionType {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MANAGE = 'MANAGE', // Full control
  ASSIGN = 'ASSIGN',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  INVITE = 'INVITE',
  REMOVE = 'REMOVE',
}

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ length: 100 })
  @Index()
  name: string; // e.g., "task:create", "project:delete"

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ResourceType,
  })
  @Index()
  resource: ResourceType;

  @Column({
    type: 'enum',
    enum: ActionType,
  })
  action: ActionType;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
