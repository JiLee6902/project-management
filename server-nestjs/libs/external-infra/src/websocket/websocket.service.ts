import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import {
  SocketEvents,
  TaskEventPayload,
  TaskDeletedEventPayload,
  CommentEventPayload,
  ProjectEventPayload,
  ProjectDeletedEventPayload,
  ProjectMemberEventPayload,
  ActivityEventPayload,
} from './dto/socket-events.dto';

@Injectable()
export class WebSocketService {
  private server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  getServer(): Server {
    return this.server;
  }

  emitToWorkspace(workspaceId: string, event: SocketEvents, payload: any) {
    if (this.server) {
      this.server.to(`workspace:${workspaceId}`).emit(event, payload);
    }
  }

  emitToProject(projectId: string, event: SocketEvents, payload: any) {
    if (this.server) {
      this.server.to(`project:${projectId}`).emit(event, payload);
    }
  }

  emitTaskCreated(payload: TaskEventPayload) {
    this.emitToWorkspace(payload.workspaceId, SocketEvents.TASK_CREATED, payload);
  }

  emitTaskUpdated(payload: TaskEventPayload) {
    this.emitToWorkspace(payload.workspaceId, SocketEvents.TASK_UPDATED, payload);
  }

  emitTaskDeleted(payload: TaskDeletedEventPayload) {
    this.emitToWorkspace(payload.workspaceId, SocketEvents.TASK_DELETED, payload);
  }

  emitCommentAdded(payload: CommentEventPayload) {
    this.emitToProject(payload.projectId, SocketEvents.COMMENT_ADDED, payload);
  }

  emitProjectCreated(payload: ProjectEventPayload) {
    this.emitToWorkspace(payload.workspaceId, SocketEvents.PROJECT_CREATED, payload);
  }

  emitProjectUpdated(payload: ProjectEventPayload) {
    this.emitToWorkspace(payload.workspaceId, SocketEvents.PROJECT_UPDATED, payload);
  }

  emitProjectDeleted(payload: ProjectDeletedEventPayload) {
    this.emitToWorkspace(payload.workspaceId, SocketEvents.PROJECT_DELETED, payload);
  }

  emitProjectMemberAdded(payload: ProjectMemberEventPayload) {
    this.emitToWorkspace(payload.workspaceId, SocketEvents.PROJECT_MEMBER_ADDED, payload);
  }

  emitActivityAdded(payload: ActivityEventPayload) {
    this.emitToProject(payload.projectId, SocketEvents.ACTIVITY_ADDED, payload);
  }
}
