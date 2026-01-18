import { SetMetadata } from '@nestjs/common';
import { ResourceType, ActionType } from '@app/entity/entities/permission.entity';

export const PERMISSIONS_KEY = 'permissions';

export interface RequiredPermission {
  resource: ResourceType;
  action: ActionType;
}

/**
 * Decorator to specify required permissions for an endpoint
 * @example
 * @Permissions({ resource: ResourceType.TASK, action: ActionType.CREATE })
 * @Permissions(
 *   { resource: ResourceType.TASK, action: ActionType.READ },
 *   { resource: ResourceType.TASK, action: ActionType.UPDATE }
 * )
 */
export const Permissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Helper function to create permission requirement
 */
export const Permission = (resource: ResourceType, action: ActionType): RequiredPermission => ({
  resource,
  action,
});
