import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Permission,
  Role,
  ResourceType,
  ActionType,
  RoleScope,
  DefaultRole,
} from '@app/entity/entities';

@Injectable()
export class PermissionSeedService implements OnModuleInit {
  private readonly logger = new Logger(PermissionSeedService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.seedPermissions();
    await this.seedDefaultRoles();
  }

  /**
   * Seed all permissions based on Resource x Action matrix
   */
  private async seedPermissions(): Promise<void> {
    const existingCount = await this.permissionRepository.count();
    if (existingCount > 0) {
      this.logger.log('Permissions already seeded, skipping...');
      return;
    }

    this.logger.log('Seeding permissions...');

    const permissions: Partial<Permission>[] = [];

    // Create permissions for each resource-action combination
    for (const resource of Object.values(ResourceType)) {
      for (const action of Object.values(ActionType)) {
        permissions.push({
          name: `${resource.toLowerCase()}:${action.toLowerCase()}`,
          description: `${action} ${resource}`,
          resource,
          action,
        });
      }
    }

    await this.permissionRepository.save(permissions);
    this.logger.log(`Seeded ${permissions.length} permissions`);
  }

  /**
   * Seed default system roles
   */
  private async seedDefaultRoles(): Promise<void> {
    const existingCount = await this.roleRepository.count({ where: { isDefault: true } });
    if (existingCount > 0) {
      this.logger.log('Default roles already seeded, skipping...');
      return;
    }

    this.logger.log('Seeding default roles...');

    // Get all permissions
    const allPermissions = await this.permissionRepository.find();
    const permissionMap = new Map<string, Permission>();
    allPermissions.forEach((p) => {
      permissionMap.set(`${p.resource}:${p.action}`, p);
    });

    // Helper to get permissions
    const getPermissions = (keys: string[]): Permission[] => {
      return keys
        .map((key) => permissionMap.get(key))
        .filter((p): p is Permission => p !== undefined);
    };

    // ==================== WORKSPACE ROLES ====================

    // Workspace Owner - Full control
    const ownerPermissions = allPermissions.filter(
      (p) => p.action === ActionType.MANAGE,
    );
    await this.createDefaultRole({
      name: DefaultRole.WORKSPACE_OWNER,
      description: 'Full control over workspace and all resources',
      scope: RoleScope.WORKSPACE,
      priority: 100,
      permissions: ownerPermissions,
    });

    // Workspace Admin - Manage most resources
    const adminPermissionKeys = [
      `${ResourceType.WORKSPACE}:${ActionType.READ}`,
      `${ResourceType.WORKSPACE}:${ActionType.UPDATE}`,
      `${ResourceType.PROJECT}:${ActionType.MANAGE}`,
      `${ResourceType.TASK}:${ActionType.MANAGE}`,
      `${ResourceType.MEMBER}:${ActionType.MANAGE}`,
      `${ResourceType.LABEL}:${ActionType.MANAGE}`,
      `${ResourceType.SPRINT}:${ActionType.MANAGE}`,
      `${ResourceType.COMMENT}:${ActionType.MANAGE}`,
      `${ResourceType.REPORT}:${ActionType.MANAGE}`,
      `${ResourceType.WEBHOOK}:${ActionType.MANAGE}`,
      `${ResourceType.SETTINGS}:${ActionType.READ}`,
      `${ResourceType.SETTINGS}:${ActionType.UPDATE}`,
    ];
    await this.createDefaultRole({
      name: DefaultRole.WORKSPACE_ADMIN,
      description: 'Manage workspace members, projects, and settings',
      scope: RoleScope.WORKSPACE,
      priority: 80,
      permissions: getPermissions(adminPermissionKeys),
    });

    // Workspace Member - Regular access
    const memberPermissionKeys = [
      `${ResourceType.WORKSPACE}:${ActionType.READ}`,
      `${ResourceType.PROJECT}:${ActionType.READ}`,
      `${ResourceType.PROJECT}:${ActionType.CREATE}`,
      `${ResourceType.TASK}:${ActionType.CREATE}`,
      `${ResourceType.TASK}:${ActionType.READ}`,
      `${ResourceType.TASK}:${ActionType.UPDATE}`,
      `${ResourceType.COMMENT}:${ActionType.MANAGE}`,
      `${ResourceType.LABEL}:${ActionType.READ}`,
      `${ResourceType.SPRINT}:${ActionType.READ}`,
      `${ResourceType.REPORT}:${ActionType.READ}`,
    ];
    await this.createDefaultRole({
      name: DefaultRole.WORKSPACE_MEMBER,
      description: 'Standard workspace member with task management',
      scope: RoleScope.WORKSPACE,
      priority: 50,
      permissions: getPermissions(memberPermissionKeys),
    });

    // Workspace Guest - Limited read access
    const guestPermissionKeys = [
      `${ResourceType.WORKSPACE}:${ActionType.READ}`,
      `${ResourceType.PROJECT}:${ActionType.READ}`,
      `${ResourceType.TASK}:${ActionType.READ}`,
      `${ResourceType.COMMENT}:${ActionType.READ}`,
    ];
    await this.createDefaultRole({
      name: DefaultRole.WORKSPACE_GUEST,
      description: 'Read-only access to workspace resources',
      scope: RoleScope.WORKSPACE,
      priority: 10,
      permissions: getPermissions(guestPermissionKeys),
    });

    // ==================== PROJECT ROLES ====================

    // Project Manager - Full project control
    const pmPermissionKeys = [
      `${ResourceType.PROJECT}:${ActionType.MANAGE}`,
      `${ResourceType.TASK}:${ActionType.MANAGE}`,
      `${ResourceType.MEMBER}:${ActionType.MANAGE}`,
      `${ResourceType.SPRINT}:${ActionType.MANAGE}`,
      `${ResourceType.LABEL}:${ActionType.MANAGE}`,
      `${ResourceType.COMMENT}:${ActionType.MANAGE}`,
      `${ResourceType.REPORT}:${ActionType.READ}`,
      `${ResourceType.SETTINGS}:${ActionType.UPDATE}`,
    ];
    await this.createDefaultRole({
      name: DefaultRole.PROJECT_MANAGER,
      description: 'Full control over project and its resources',
      scope: RoleScope.PROJECT,
      priority: 80,
      permissions: getPermissions(pmPermissionKeys),
    });

    // Project Member - Standard project access
    const projectMemberKeys = [
      `${ResourceType.PROJECT}:${ActionType.READ}`,
      `${ResourceType.TASK}:${ActionType.CREATE}`,
      `${ResourceType.TASK}:${ActionType.READ}`,
      `${ResourceType.TASK}:${ActionType.UPDATE}`,
      `${ResourceType.COMMENT}:${ActionType.MANAGE}`,
      `${ResourceType.SPRINT}:${ActionType.READ}`,
      `${ResourceType.LABEL}:${ActionType.READ}`,
    ];
    await this.createDefaultRole({
      name: DefaultRole.PROJECT_MEMBER,
      description: 'Standard project member with task management',
      scope: RoleScope.PROJECT,
      priority: 50,
      permissions: getPermissions(projectMemberKeys),
    });

    // Project Viewer - Read-only
    const viewerPermissionKeys = [
      `${ResourceType.PROJECT}:${ActionType.READ}`,
      `${ResourceType.TASK}:${ActionType.READ}`,
      `${ResourceType.COMMENT}:${ActionType.READ}`,
      `${ResourceType.SPRINT}:${ActionType.READ}`,
    ];
    await this.createDefaultRole({
      name: DefaultRole.PROJECT_VIEWER,
      description: 'Read-only access to project resources',
      scope: RoleScope.PROJECT,
      priority: 10,
      permissions: getPermissions(viewerPermissionKeys),
    });

    this.logger.log('Default roles seeded successfully');
  }

  private async createDefaultRole(data: {
    name: string;
    description: string;
    scope: RoleScope;
    priority: number;
    permissions: Permission[];
  }): Promise<Role> {
    const role = this.roleRepository.create({
      name: data.name,
      description: data.description,
      scope: data.scope,
      priority: data.priority,
      isDefault: true,
      permissions: data.permissions,
    });
    // System roles have no workspace (workspaceId remains undefined/null)

    return this.roleRepository.save(role);
  }
}
