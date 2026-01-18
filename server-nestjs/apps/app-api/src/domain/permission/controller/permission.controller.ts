import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guard';
import { RoleService } from '../service/role.service';
import { PermissionService } from '../service/permission.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto, CloneRoleDto } from '../dto';
import {
  CheckPolicy,
  PolicyType,
  RequireWorkspaceAdmin,
} from '@app/shared-libs/decorators/check-policy.decorator';

@ApiTags('Permissions & Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PermissionController {
  constructor(
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
  ) {}

  // ==================== PERMISSIONS ====================

  @Get('permissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all available permissions' })
  @ApiResponse({ status: 200, description: 'List of all permissions' })
  async getAllPermissions() {
    return this.permissionService.getRolePermissions(''); // Returns empty, use roleService
  }

  @Get('permissions/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all permission definitions' })
  @ApiResponse({ status: 200, description: 'All permission definitions' })
  async getPermissionDefinitions() {
    return this.roleService.getAllPermissions();
  }

  // ==================== SYSTEM ROLES ====================

  @Get('roles/system')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all system (default) roles' })
  @ApiResponse({ status: 200, description: 'List of system roles' })
  async getSystemRoles() {
    return this.roleService.getSystemRoles();
  }

  // ==================== WORKSPACE ROLES ====================

  @Get('workspaces/:workspaceId/roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get roles for a workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'List of workspace roles' })
  @CheckPolicy({ type: PolicyType.IS_WORKSPACE_MEMBER, workspaceIdParam: 'workspaceId' })
  async getWorkspaceRoles(@Param('workspaceId') workspaceId: string) {
    return this.roleService.getWorkspaceRoles(workspaceId);
  }

  @Post('workspaces/:workspaceId/roles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a custom role for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @RequireWorkspaceAdmin('workspaceId')
  async createWorkspaceRole(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.roleService.createRole(workspaceId, dto);
  }

  @Patch('workspaces/:workspaceId/roles/:roleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a custom role' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @RequireWorkspaceAdmin('workspaceId')
  async updateRole(
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roleService.updateRole(roleId, dto);
  }

  @Delete('workspaces/:workspaceId/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a custom role' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({ status: 204, description: 'Role deleted successfully' })
  @RequireWorkspaceAdmin('workspaceId')
  async deleteRole(@Param('roleId') roleId: string) {
    await this.roleService.deleteRole(roleId);
  }

  @Post('workspaces/:workspaceId/roles/:roleId/clone')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Clone a role' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID to clone' })
  @ApiResponse({ status: 201, description: 'Role cloned successfully' })
  @RequireWorkspaceAdmin('workspaceId')
  async cloneRole(
    @Param('workspaceId') workspaceId: string,
    @Param('roleId') roleId: string,
    @Body() dto: CloneRoleDto,
  ) {
    return this.roleService.cloneRole(roleId, workspaceId, dto.newName);
  }

  // ==================== ROLE ASSIGNMENT ====================

  @Post('workspaces/:workspaceId/members/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign role to workspace member' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Role assigned successfully' })
  @RequireWorkspaceAdmin('workspaceId')
  async assignWorkspaceRole(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: AssignRoleDto,
  ) {
    await this.roleService.assignWorkspaceRole(workspaceId, dto.userId, dto.roleId);
    return { message: 'Role assigned successfully' };
  }

  @Post('projects/:projectId/members/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign role to project member' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Role assigned successfully' })
  @CheckPolicy({ type: PolicyType.IS_PROJECT_MANAGER, projectIdParam: 'projectId' })
  async assignProjectRole(
    @Param('projectId') projectId: string,
    @Body() dto: AssignRoleDto,
  ) {
    await this.roleService.assignProjectRole(projectId, dto.userId, dto.roleId);
    return { message: 'Role assigned successfully' };
  }

  // ==================== PROJECT ROLES ====================

  @Get('workspaces/:workspaceId/project-roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get project roles for a workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'List of project roles' })
  @CheckPolicy({ type: PolicyType.IS_WORKSPACE_MEMBER, workspaceIdParam: 'workspaceId' })
  async getProjectRoles(@Param('workspaceId') workspaceId: string) {
    return this.roleService.getProjectRoles(workspaceId);
  }

  // ==================== ROLE DETAILS ====================

  @Get('roles/:roleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get role details with permissions' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role details' })
  async getRoleById(@Param('roleId') roleId: string) {
    return this.roleService.getRoleById(roleId);
  }
}
