import { Injectable, NotFoundException } from '@nestjs/common';
import { WebSocketService } from '@app/external-infra';
import { NotificationRepository } from '../repository/notification.repository';
import { NotificationType } from '@app/entity/entities';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly webSocketService: WebSocketService,
  ) {}

  async getNotifications(userId: string, limit = 20, offset = 0) {
    const notifications = await this.notificationRepository.findByUser(userId, limit, offset);
    const unreadCount = await this.notificationRepository.countUnread(userId);
    return { notifications, unreadCount };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepository.countUnread(userId);
    return { count };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }
    await this.notificationRepository.markAsRead(notificationId, userId);
    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) {
    const notification = await this.notificationRepository.create(data);

    this.webSocketService.emitToWorkspace(
      data.data?.workspaceId || 'global',
      'notification:new' as any,
      { notification },
    );

    return notification;
  }
}
