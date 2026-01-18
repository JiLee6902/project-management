import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, RequiredPermission } from '../decorators/permissions.decorator';

// Re-export for convenience
export { RequiredPermission } from '../decorators/permissions.decorator';

export const PERMISSION_SERVICE = 'PERMISSION_SERVICE';

export interface IPermissionService {
  checkUserPermissions(
    userId: string,
    workspaceId: string,
    projectId: string | null,
    requiredPermissions: RequiredPermission[],
  ): Promise<boolean>;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(PERMISSION_SERVICE)
    private permissionService: IPermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied: User not authenticated');
    }

    // Extract workspace and project IDs from request
    const workspaceId = this.extractWorkspaceId(request);
    const projectId = this.extractProjectId(request);

    if (!workspaceId) {
      throw new ForbiddenException('Access denied: Workspace context required');
    }

    // Check if user has required permissions
    const hasPermission = await this.permissionService.checkUserPermissions(
      user.id,
      workspaceId,
      projectId,
      requiredPermissions,
    );

    if (!hasPermission) {
      throw new ForbiddenException('Access denied: Insufficient permissions');
    }

    return true;
  }

  private extractWorkspaceId(request: any): string | null {
    // Try to get from params first
    if (request.params?.workspaceId) {
      return request.params.workspaceId;
    }

    // Try to get from body
    if (request.body?.workspaceId) {
      return request.body.workspaceId;
    }

    // Try to get from query
    if (request.query?.workspaceId) {
      return request.query.workspaceId;
    }

    // Try to get from user's default workspace
    if (request.user?.defaultWorkspaceId) {
      return request.user.defaultWorkspaceId;
    }

    return null;
  }

  private extractProjectId(request: any): string | null {
    if (request.params?.projectId) {
      return request.params.projectId;
    }

    if (request.body?.projectId) {
      return request.body.projectId;
    }

    if (request.query?.projectId) {
      return request.query.projectId;
    }

    return null;
  }
}
