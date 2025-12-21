import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../constants';
import { NotificationJobData } from '../queue.service';

@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  async process(job: Job<NotificationJobData>): Promise<any> {
    const { userId, type, title, message, data } = job.data;

    try {
      console.log(`Notification sent to user ${userId}:`, { type, title, message, data });
      return { success: true, userId, type };
    } catch (error) {
      console.error(`Notification job ${job.id} failed:`, error);
      throw error;
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log(`Processing notification job ${job.id} for user ${job.data.userId}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    console.log(`Notification job ${job.id} completed:`, result);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.error(`Notification job ${job.id} failed:`, error.message);
  }
}
