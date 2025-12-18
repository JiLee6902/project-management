import { Injectable } from '@nestjs/common';
import { EmailService, NotificationEventDto, NotificationType } from '@app/external-infra';

@Injectable()
export class NotificationService {
  constructor(private readonly emailService: EmailService) {}

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
      await this.emailService.sendTaskAssignmentEmail({
        to: event.userEmail,
        userName: event.data?.userName || event.userEmail.split('@')[0],
        taskId: event.data?.taskId,
        taskTitle: event.data?.taskTitle || event.title,
        taskDescription: event.data?.taskDescription || event.message,
        projectName: event.data?.projectName || 'Project',
        dueDate: event.data?.dueDate,
        origin: event.data?.origin,
      });

      console.log(`Task assignment email sent to ${event.userEmail}`);
    } catch (error) {
      console.error('Failed to send task assignment email:', error);
    }
  }

  private async handleTaskDueReminder(event: NotificationEventDto): Promise<void> {
    try {
      await this.emailService.sendTaskReminderEmail({
        to: event.userEmail,
        userName: event.userEmail.split('@')[0],
        taskTitle: event.data?.taskTitle || event.title,
        projectName: event.data?.projectName || 'Project',
        dueDate: event.data?.dueDate || new Date(),
      });

      console.log(`Task reminder email sent to ${event.userEmail}`);
    } catch (error) {
      console.error('Failed to send task reminder email:', error);
    }
  }

  private async handleCommentAdded(event: NotificationEventDto): Promise<void> {
    // TODO: Implement email notification for new comments
    console.log(`Comment notification for user ${event.userId}`);
  }
}
