import { Injectable } from '@nestjs/common';
import { QueueService, NotificationEventDto, NotificationType } from '@app/external-infra';

@Injectable()
export class NotificationService {
  constructor(private readonly queueService: QueueService) {}

  async processNotification(event: NotificationEventDto): Promise<void> {
    console.log(`Processing notification: ${event.type} for user ${event.userId}`);

    switch (event.type) {
      case NotificationType.TASK_ASSIGNED:
        await this.handleTaskAssigned(event);
        break;

      case NotificationType.TASK_DUE_REMINDER:
        await this.handleTaskDueReminder(event);
        break;

      case NotificationType.COMMENT_ADDED:
        await this.handleCommentAdded(event);
        break;

      default:
        console.log(`Unhandled notification type: ${event.type}`);
    }
  }

  private async handleTaskAssigned(event: NotificationEventDto): Promise<void> {
    try {
      await this.queueService.addTaskAssignmentEmailJob({
        to: event.userEmail,
        userName: event.data?.userName || event.userEmail.split('@')[0],
        taskId: event.data?.taskId,
        taskTitle: event.data?.taskTitle || event.title,
        taskDescription: event.data?.taskDescription || event.message,
        projectName: event.data?.projectName || 'Project',
        dueDate: event.data?.dueDate,
        origin: event.data?.origin,
      });

      console.log(`Task assignment email queued for ${event.userEmail}`);
    } catch (error) {
      console.error('Failed to queue task assignment email:', error);
    }
  }

  private async handleTaskDueReminder(event: NotificationEventDto): Promise<void> {
    try {
      await this.queueService.addTaskReminderEmailJob({
        to: event.userEmail,
        userName: event.userEmail.split('@')[0],
        taskTitle: event.data?.taskTitle || event.title,
        projectName: event.data?.projectName || 'Project',
        dueDate: event.data?.dueDate || new Date(),
      });

      console.log(`Task reminder email queued for ${event.userEmail}`);
    } catch (error) {
      console.error('Failed to queue task reminder email:', error);
    }
  }

  private async handleCommentAdded(event: NotificationEventDto): Promise<void> {
    console.log(`Comment notification for user ${event.userId}`);
  }
}
