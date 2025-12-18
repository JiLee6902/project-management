export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_DUE_REMINDER = 'TASK_DUE_REMINDER',
  TASK_COMPLETED = 'TASK_COMPLETED',
  PROJECT_INVITATION = 'PROJECT_INVITATION',
  WORKSPACE_INVITATION = 'WORKSPACE_INVITATION',
  COMMENT_ADDED = 'COMMENT_ADDED',
}

export class NotificationEventDto {
  type: NotificationType;
  userId: string;
  userEmail: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: Date;

  constructor(partial: Partial<NotificationEventDto>) {
    Object.assign(this, partial);
    this.createdAt = new Date();
  }

  static taskAssigned(params: {
    userId: string;
    userEmail: string;
    userName?: string;
    taskId: string;
    taskTitle: string;
    taskDescription?: string;
    projectName: string;
    dueDate?: Date;
    origin?: string;
  }): NotificationEventDto {
    return new NotificationEventDto({
      type: NotificationType.TASK_ASSIGNED,
      userId: params.userId,
      userEmail: params.userEmail,
      title: 'New Task Assigned',
      message: `You have been assigned to task "${params.taskTitle}" in project "${params.projectName}"`,
      data: {
        userName: params.userName,
        taskId: params.taskId,
        taskTitle: params.taskTitle,
        taskDescription: params.taskDescription,
        projectName: params.projectName,
        dueDate: params.dueDate,
        origin: params.origin,
      },
    });
  }

  static taskDueReminder(params: {
    userId: string;
    userEmail: string;
    taskTitle: string;
    projectName: string;
    dueDate: Date;
  }): NotificationEventDto {
    return new NotificationEventDto({
      type: NotificationType.TASK_DUE_REMINDER,
      userId: params.userId,
      userEmail: params.userEmail,
      title: 'Task Due Reminder',
      message: `Task "${params.taskTitle}" in project "${params.projectName}" is due today!`,
      data: {
        taskTitle: params.taskTitle,
        projectName: params.projectName,
        dueDate: params.dueDate,
      },
    });
  }
}
