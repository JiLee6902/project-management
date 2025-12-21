import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, JobsOptions } from 'bullmq';
import { QUEUE_NAMES } from './constants';

export enum EmailType {
  GENERIC = 'generic',
  TASK_REMINDER = 'task_reminder',
  TASK_ASSIGNMENT = 'task_assignment',
}

export interface EmailJobData {
  emailType: EmailType;
  to: string;
  // For generic email
  subject?: string;
  html?: string;
  // For task reminder
  userName?: string;
  taskTitle?: string;
  projectName?: string;
  dueDate?: Date;
  // For task assignment
  taskId?: string;
  taskDescription?: string;
  origin?: string;
}

export interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface ReportJobData {
  type: string;
  userId: string;
  params: Record<string, any>;
}

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL) private emailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private notificationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.REPORT) private reportQueue: Queue,
  ) {}

  async addEmailJob(data: EmailJobData, options?: JobsOptions) {
    return this.emailQueue.add('send', data, {
      priority: 2,
      ...options,
    });
  }

  async addTaskReminderEmailJob(
    data: {
      to: string;
      userName: string;
      taskTitle: string;
      projectName: string;
      dueDate: Date;
    },
    options?: JobsOptions,
  ) {
    return this.addEmailJob(
      {
        emailType: EmailType.TASK_REMINDER,
        ...data,
      },
      options,
    );
  }

  async addTaskAssignmentEmailJob(
    data: {
      to: string;
      userName: string;
      taskId?: string;
      taskTitle: string;
      taskDescription?: string;
      projectName: string;
      dueDate?: Date;
      origin?: string;
    },
    options?: JobsOptions,
  ) {
    return this.addEmailJob(
      {
        emailType: EmailType.TASK_ASSIGNMENT,
        ...data,
      },
      options,
    );
  }

  async addNotificationJob(data: NotificationJobData, options?: JobsOptions) {
    return this.notificationQueue.add('push', data, {
      priority: 1,
      ...options,
    });
  }

  async addReportJob(data: ReportJobData, options?: JobsOptions) {
    return this.reportQueue.add('generate', data, {
      priority: 3,
      ...options,
    });
  }

  async getEmailQueueStatus() {
    const counts = await this.emailQueue.getJobCounts();
    return counts;
  }

  async getNotificationQueueStatus() {
    const counts = await this.notificationQueue.getJobCounts();
    return counts;
  }
}
