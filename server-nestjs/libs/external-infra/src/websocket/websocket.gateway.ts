import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { WebSocketService } from './websocket.service';
import { SocketEvents } from './dto/socket-events.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/',
})
export class AppWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppWebSocketGateway.name);

  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.webSocketService.setServer(server);
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET') || 'default-secret-key';
      const decoded = jwt.verify(token as string, secret) as any;

      if (!decoded?.sub) {
        this.logger.warn(`Client ${client.id} has invalid token`);
        client.disconnect();
        return;
      }

      client.userId = decoded.sub;
      client.userEmail = decoded.email;

      this.logger.log(
        `Client connected: ${client.id} (User: ${client.userId})`,
      );
    } catch (error) {
      this.logger.error(`Client ${client.id} authentication failed:`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(
      `Client disconnected: ${client.id} (User: ${client.userId || 'unknown'})`,
    );
  }

  @SubscribeMessage(SocketEvents.JOIN_WORKSPACE)
  handleJoinWorkspace(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { workspaceId: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    const room = `workspace:${data.workspaceId}`;
    client.join(room);
    this.logger.debug(
      `User ${client.userId} joined workspace room: ${room}`,
    );

    return { success: true, room };
  }

  @SubscribeMessage(SocketEvents.LEAVE_WORKSPACE)
  handleLeaveWorkspace(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { workspaceId: string },
  ) {
    const room = `workspace:${data.workspaceId}`;
    client.leave(room);
    this.logger.debug(
      `User ${client.userId} left workspace room: ${room}`,
    );

    return { success: true };
  }

  @SubscribeMessage(SocketEvents.JOIN_PROJECT)
  handleJoinProject(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { projectId: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    const room = `project:${data.projectId}`;
    client.join(room);
    this.logger.debug(
      `User ${client.userId} joined project room: ${room}`,
    );

    return { success: true, room };
  }

  @SubscribeMessage(SocketEvents.LEAVE_PROJECT)
  handleLeaveProject(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { projectId: string },
  ) {
    const room = `project:${data.projectId}`;
    client.leave(room);
    this.logger.debug(
      `User ${client.userId} left project room: ${room}`,
    );

    return { success: true };
  }
}
