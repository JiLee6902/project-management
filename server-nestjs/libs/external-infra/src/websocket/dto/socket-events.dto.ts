export enum SocketEvents {
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_DELETED = 'task:deleted',
  COMMENT_ADDED = 'comment:added',
  ACTIVITY_ADDED = 'activity:added',
  PROJECT_CREATED = 'project:created',
  PROJECT_UPDATED = 'project:updated',
  PROJECT_DELETED = 'project:deleted',
  PROJECT_MEMBER_ADDED = 'project:member:added',
  WORKSPACE_UPDATED = 'workspace:updated',
  JOIN_WORKSPACE = 'join:workspace',
  LEAVE_WORKSPACE = 'leave:workspace',
  JOIN_PROJECT = 'join:project',
  LEAVE_PROJECT = 'leave:project',
}

export interface TaskEventPayload {
  task: any;
  projectId: string;
  workspaceId: string;
}

export interface TaskDeletedEventPayload {
  taskIds: string[];
  projectId: string;
  workspaceId: string;
}

export interface CommentEventPayload {
  comment: any;
  taskId: string;
  projectId: string;
  workspaceId?: string;
}

export interface ProjectEventPayload {
  project: any;
  workspaceId: string;
}

export interface ProjectDeletedEventPayload {
  projectId: string;
  workspaceId: string;
}

export interface ProjectMemberEventPayload {
  projectId: string;
  workspaceId: string;
  member: any;
}

export interface ActivityEventPayload {
  activity: any;
  projectId: string;
  taskId?: string;
}
