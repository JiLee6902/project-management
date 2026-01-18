import { SetMetadata } from '@nestjs/common';

export const POLICY_KEY = 'policy';

/**
 * Policy types for ABAC (Attribute-Based Access Control)
 */
export enum PolicyType {
  // Resource ownership policies
  IS_OWNER = 'IS_OWNER',                     // User owns the resource
  IS_CREATOR = 'IS_CREATOR',                 // User created the resource
  IS_ASSIGNEE = 'IS_ASSIGNEE',               // User is assigned to the resource

  // Membership policies
  IS_WORKSPACE_MEMBER = 'IS_WORKSPACE_MEMBER', // User is member of workspace
  IS_PROJECT_MEMBER = 'IS_PROJECT_MEMBER',     // User is member of project
  IS_WORKSPACE_ADMIN = 'IS_WORKSPACE_ADMIN',   // User is admin of workspace
  IS_PROJECT_MANAGER = 'IS_PROJECT_MANAGER',   // User is manager of project

  // Combined policies
  CAN_MANAGE_MEMBERS = 'CAN_MANAGE_MEMBERS',   // Can invite/remove members
  CAN_MANAGE_SETTINGS = 'CAN_MANAGE_SETTINGS', // Can change settings
}

export interface PolicyCheck {
  type: PolicyType;
  resourceIdParam?: string;  // Parameter name containing resource ID (e.g., 'taskId', 'projectId')
  workspaceIdParam?: string; // Parameter name for workspace context
  projectIdParam?: string;   // Parameter name for project context
}

/**
 * Decorator to apply ABAC policy checks
 * @example
 * @CheckPolicy({ type: PolicyType.IS_ASSIGNEE, resourceIdParam: 'taskId' })
 * @CheckPolicy({ type: PolicyType.IS_WORKSPACE_MEMBER, workspaceIdParam: 'workspaceId' })
 */
export const CheckPolicy = (...policies: PolicyCheck[]) =>
  SetMetadata(POLICY_KEY, policies);

/**
 * Shorthand decorators for common policies
 */
export const RequireWorkspaceMember = (workspaceIdParam = 'workspaceId') =>
  CheckPolicy({ type: PolicyType.IS_WORKSPACE_MEMBER, workspaceIdParam });

export const RequireProjectMember = (projectIdParam = 'projectId') =>
  CheckPolicy({ type: PolicyType.IS_PROJECT_MEMBER, projectIdParam });

export const RequireWorkspaceAdmin = (workspaceIdParam = 'workspaceId') =>
  CheckPolicy({ type: PolicyType.IS_WORKSPACE_ADMIN, workspaceIdParam });

export const RequireProjectManager = (projectIdParam = 'projectId') =>
  CheckPolicy({ type: PolicyType.IS_PROJECT_MANAGER, projectIdParam });

export const RequireResourceOwner = (resourceIdParam: string) =>
  CheckPolicy({ type: PolicyType.IS_OWNER, resourceIdParam });

export const RequireTaskAssignee = (taskIdParam = 'taskId') =>
  CheckPolicy({ type: PolicyType.IS_ASSIGNEE, resourceIdParam: taskIdParam });
