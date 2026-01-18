import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import {
  Role,
  Permission,
  RoleScope,
  DefaultRole,
  WorkspaceMember,
  ProjectMember,
} from '@app/entity/entities';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
  ) {}

  /**
   * Get all system roles (default roles)
   */
  async getSystemRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      where: { workspaceId: IsNull(), isDefault: true },
      relations: ['permissions'],
      order: { priority: 'DESC' },
    });
  }

  /**
   * Get workspace-specific roles (custom roles)
   */
  async getWorkspaceRoles(workspaceId: string): Promise<Role[]> {
    return this.roleRepository.find({
      where: [
        { workspaceId, scope: RoleScope.WORKSPACE },
        { workspaceId: IsNull(), scope: RoleScope.WORKSPACE, isDefault: true },
      ],
      relations: ['permissions'],
      order: { priority: 'DESC' },
    });
  }

  /**
   * Get project-specific roles
   */
  async getProjectRoles(workspaceId: string): Promise<Role[]> {
    return this.roleRepository.find({
      where: [
        { workspaceId, scope: RoleScope.PROJECT },
        { workspaceId: IsNull(), scope: RoleScope.PROJECT, isDefault: true },
      ],
      relations: ['permissions'],
      order: { priority: 'DESC' },
    });
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  /**
   * Create a custom role for a workspace
   */
  async createRole(
    workspaceId: string,
    data: {
      name: string;
      description?: string;
      scope: RoleScope;
      permissionIds?: string[];
      priority?: number;
    },
  ): Promise<Role> {
    // Check if role name already exists in workspace
    const existing = await this.roleRepository.findOne({
      where: { workspaceId, name: data.name },
    });

    if (existing) {
      throw new BadRequestException('Role with this name already exists');
    }

    // Get permissions
    let permissions: Permission[] = [];
    if (data.permissionIds && data.permissionIds.length > 0) {
      permissions = await this.permissionRepository.findByIds(data.permissionIds);
    }

    const role = this.roleRepository.create({
      name: data.name,
      description: data.description,
      scope: data.scope,
      workspaceId,
      isDefault: false,
      priority: data.priority || 0,
      permissions,
    });

    return this.roleRepository.save(role);
  }

  /**
   * Update a custom role
   */
  async updateRole(
    roleId: string,
    data: {
      name?: string;
      description?: string;
      permissionIds?: string[];
      priority?: number;
    },
  ): Promise<Role> {
    const role = await this.getRoleById(roleId);

    if (role.isDefault) {
      throw new BadRequestException('Cannot modify default system roles');
    }

    if (data.name) role.name = data.name;
    if (data.description !== undefined) role.description = data.description;
    if (data.priority !== undefined) role.priority = data.priority;

    if (data.permissionIds) {
      role.permissions = await this.permissionRepository.findByIds(data.permissionIds);
    }

    return this.roleRepository.save(role);
  }

  /**
   * Delete a custom role
   */
  async deleteRole(roleId: string): Promise<void> {
    const role = await this.getRoleById(roleId);

    if (role.isDefault) {
      throw new BadRequestException('Cannot delete default system roles');
    }

    // Check if role is in use
    const workspaceMembers = await this.workspaceMemberRepository.count({
      where: { roleId },
    });
    const projectMembers = await this.projectMemberRepository.count({
      where: { roleId },
    });

    if (workspaceMembers > 0 || projectMembers > 0) {
      throw new BadRequestException(
        'Cannot delete role that is assigned to members. Please reassign members first.',
      );
    }

    await this.roleRepository.remove(role);
  }

  /**
   * Assign role to workspace member
   */
  async assignWorkspaceRole(
    workspaceId: string,
    userId: string,
    roleId: string,
  ): Promise<void> {
    const role = await this.getRoleById(roleId);

    if (role.scope !== RoleScope.WORKSPACE && role.scope !== RoleScope.SYSTEM) {
      throw new BadRequestException('Invalid role scope for workspace member');
    }

    const member = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId },
    });

    if (!member) {
      throw new NotFoundException('Workspace member not found');
    }

    member.roleId = roleId;
    await this.workspaceMemberRepository.save(member);
  }

  /**
   * Assign role to project member
   */
  async assignProjectRole(
    projectId: string,
    userId: string,
    roleId: string,
  ): Promise<void> {
    const role = await this.getRoleById(roleId);

    if (role.scope !== RoleScope.PROJECT) {
      throw new BadRequestException('Invalid role scope for project member');
    }

    const member = await this.projectMemberRepository.findOne({
      where: { projectId, userId },
    });

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    member.roleId = roleId;
    await this.projectMemberRepository.save(member);
  }

  /**
   * Clone a role (for creating workspace-specific variants)
   */
  async cloneRole(roleId: string, workspaceId: string, newName: string): Promise<Role> {
    const sourceRole = await this.getRoleById(roleId);

    return this.createRole(workspaceId, {
      name: newName,
      description: sourceRole.description,
      scope: sourceRole.scope,
      permissionIds: sourceRole.permissions.map((p) => p.id),
      priority: sourceRole.priority,
    });
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }
}
