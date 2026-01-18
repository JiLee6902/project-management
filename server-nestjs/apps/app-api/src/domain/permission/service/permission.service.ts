import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Permission,
  Role,
  WorkspaceMember,
  ProjectMember,
  ResourceType,
  ActionType,
} from '@app/entity/entities';
import {
  IPermissionService,
  RequiredPermission,
} from '@app/shared-libs/guards/permissions.guard';

@Injectable()
export class PermissionService implements IPermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
  ) {}

  /**
   * Check if user has all required permissions
   */
  async checkUserPermissions(
    userId: string,
    workspaceId: string,
    projectId: string | null,
    requiredPermissions: RequiredPermission[],
  ): Promise<boolean> {
    // Get user's permissions based on their roles
    const userPermissions = await this.getUserPermissions(userId, workspaceId, projectId);

    // Check if user has all required permissions
    for (const required of requiredPermissions) {
      const hasPermission = userPermissions.some(
        (p) =>
          (p.resource === required.resource && p.action === required.action) ||
          (p.resource === required.resource && p.action === ActionType.MANAGE), // MANAGE includes all actions
      );

      if (!hasPermission) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all permissions for a user in a specific context
   */
  async getUserPermissions(
    userId: string,
    workspaceId: string,
    projectId: string | null,
  ): Promise<Permission[]> {
    const permissions: Permission[] = [];

    // Get workspace-level role and permissions
    const workspaceMember = await this.workspaceMemberRepository.findOne({
      where: { userId, workspaceId },
      relations: ['assignedRole', 'assignedRole.permissions'],
    });

    if (workspaceMember?.assignedRole?.permissions) {
      permissions.push(...workspaceMember.assignedRole.permissions);
    }

    // Also check legacy role and add implicit permissions
    if (workspaceMember) {
      const legacyPermissions = this.getLegacyWorkspacePermissions(workspaceMember.role);
      permissions.push(...legacyPermissions);
    }

    // Get project-level role and permissions if projectId is provided
    if (projectId) {
      const projectMember = await this.projectMemberRepository.findOne({
        where: { userId, projectId },
        relations: ['assignedRole', 'assignedRole.permissions'],
      });

      if (projectMember?.assignedRole?.permissions) {
        permissions.push(...projectMember.assignedRole.permissions);
      }

      // Legacy project permissions
      if (projectMember) {
        const legacyPermissions = this.getLegacyProjectPermissions(projectMember.role);
        permissions.push(...legacyPermissions);
      }
    }

    // Remove duplicates
    return this.deduplicatePermissions(permissions);
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(
    userId: string,
    workspaceId: string,
    projectId: string | null,
    resource: ResourceType,
    action: ActionType,
  ): Promise<boolean> {
    return this.checkUserPermissions(userId, workspaceId, projectId, [{ resource, action }]);
  }

  /**
   * Get all permissions for a role
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });
    return role?.permissions || [];
  }

  /**
   * Assign permission to a role
   */
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    if (!role.permissions.some((p) => p.id === permissionId)) {
      role.permissions.push(permission);
      await this.roleRepository.save(role);
    }
  }

  /**
   * Remove permission from a role
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    role.permissions = role.permissions.filter((p) => p.id !== permissionId);
    await this.roleRepository.save(role);
  }

  /**
   * Get legacy workspace permissions based on simple role enum
   */
  private getLegacyWorkspacePermissions(role: string): Permission[] {
    // Create pseudo-permissions based on legacy roles
    const permissions: Permission[] = [];

    switch (role) {
      case 'OWNER':
        // Owner has all permissions
        Object.values(ResourceType).forEach((resource) => {
          permissions.push({
            resource,
            action: ActionType.MANAGE,
          } as Permission);
        });
        break;

      case 'ADMIN':
        // Admin has most permissions except workspace deletion
        const adminResources = [
          ResourceType.PROJECT,
          ResourceType.TASK,
          ResourceType.MEMBER,
          ResourceType.LABEL,
          ResourceType.SPRINT,
          ResourceType.COMMENT,
          ResourceType.REPORT,
          ResourceType.WEBHOOK,
        ];
        adminResources.forEach((resource) => {
          permissions.push({ resource, action: ActionType.MANAGE } as Permission);
        });
        permissions.push({ resource: ResourceType.WORKSPACE, action: ActionType.READ } as Permission);
        permissions.push({ resource: ResourceType.WORKSPACE, action: ActionType.UPDATE } as Permission);
        permissions.push({ resource: ResourceType.SETTINGS, action: ActionType.READ } as Permission);
        permissions.push({ resource: ResourceType.SETTINGS, action: ActionType.UPDATE } as Permission);
        break;

      case 'MEMBER':
        // Member has limited permissions
        permissions.push({ resource: ResourceType.WORKSPACE, action: ActionType.READ } as Permission);
        permissions.push({ resource: ResourceType.PROJECT, action: ActionType.READ } as Permission);
        permissions.push({ resource: ResourceType.PROJECT, action: ActionType.CREATE } as Permission);
        permissions.push({ resource: ResourceType.TASK, action: ActionType.MANAGE } as Permission);
        permissions.push({ resource: ResourceType.COMMENT, action: ActionType.MANAGE } as Permission);
        permissions.push({ resource: ResourceType.LABEL, action: ActionType.READ } as Permission);
        permissions.push({ resource: ResourceType.SPRINT, action: ActionType.READ } as Permission);
        permissions.push({ resource: ResourceType.REPORT, action: ActionType.READ } as Permission);
        break;

      case 'GUEST':
        // Guest has read-only access
        permissions.push({ resource: ResourceType.WORKSPACE, action: ActionType.READ } as Permission);
        permissions.push({ resource: ResourceType.PROJECT, action: ActionType.READ } as Permission);
        permissions.push({ resource: ResourceType.TASK, action: ActionType.READ } as Permission);
        permissions.push({ resource: ResourceType.COMMENT, action: ActionType.READ } as Permission);
        break;
    }

    return permissions;
  }

  /**
   * Get legacy project permissions based on simple role enum
   */
  private getLegacyProjectPermissions(role: string): Permission[] {
    const permissions: Permission[] = [];

    switch (role) {
      case 'MANAGER':
        permissions.push({ resource: ResourceType.PROJECT, action: ActionType.MANAGE } as Permission);
        permissions.push({ resource: ResourceType.TASK, action: ActionType.MANAGE } as Permission);
        permissions.push({ resource: ResourceType.MEMBER, action: ActionType.MANAGE } as Permission);
        permissions.push({ resource: ResourceType.SPRINT, action: ActionType.MANAGE } as Permission);
        permissions.push({ resource: ResourceType.LABEL, action: ActionType.MANAGE } as Permission);
        break;

      case 'MEMBER':
        permissions.push({ resource: ResourceType.PROJECT, action: ActionType.READ } as Permission);
        permissions.push({ resource: ResourceType.TASK, action: ActionType.MANAGE } as Permission);
        permissions.push({ resource: ResourceType.COMMENT, action: ActionType.MANAGE } as Permission);
        permissions.push({ resource: ResourceType.SPRINT, action: ActionType.READ } as Permission);
        permissions.push({ resource: ResourceType.LABEL, action: ActionType.READ } as Permission);
        break;

      case 'VIEWER':
        permissions.push({ resource: ResourceType.PROJECT, action: ActionType.READ } as Permission);
        permissions.push({ resource: ResourceType.TASK, action: ActionType.READ } as Permission);
        permissions.push({ resource: ResourceType.COMMENT, action: ActionType.READ } as Permission);
        break;
    }

    return permissions;
  }

  /**
   * Remove duplicate permissions
   */
  private deduplicatePermissions(permissions: Permission[]): Permission[] {
    const seen = new Set<string>();
    return permissions.filter((p) => {
      const key = `${p.resource}:${p.action}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}
