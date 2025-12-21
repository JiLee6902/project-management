import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../constants';
import { EmailJobData, EmailType } from '../queue.service';
import { EmailService } from '../../email/service/email.service';

@Processor(QUEUE_NAMES.EMAIL)
export class EmailProcessor extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<any> {
    const data = job.data;

    try {
      switch (data.emailType) {
        case EmailType.TASK_REMINDER:
          await this.emailService.sendTaskReminderEmail({
            to: data.to,
            userName: data.userName || data.to.split('@')[0],
            taskTitle: data.taskTitle || 'Task',
            projectName: data.projectName || 'Project',
            dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
          });
          return { success: true, to: data.to, type: 'task_reminder' };

        case EmailType.TASK_ASSIGNMENT:
          await this.emailService.sendTaskAssignmentEmail({
            to: data.to,
            userName: data.userName || data.to.split('@')[0],
            taskId: data.taskId,
            taskTitle: data.taskTitle || 'Task',
            taskDescription: data.taskDescription,
            projectName: data.projectName || 'Project',
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            origin: data.origin,
          });
          return { success: true, to: data.to, type: 'task_assignment' };

        case EmailType.GENERIC:
        default:
          await this.emailService.sendEmail({
            to: data.to,
            subject: data.subject || 'Notification',
            html: data.html || '',
          });
          return { success: true, to: data.to, type: 'generic' };
      }
    } catch (error) {
      console.error(`Email job ${job.id} failed:`, error);
      throw error;
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log(`Processing email job ${job.id} to ${job.data.to}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    console.log(`Email job ${job.id} completed:`, result);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.error(`Email job ${job.id} failed:`, error.message);
  }
}
