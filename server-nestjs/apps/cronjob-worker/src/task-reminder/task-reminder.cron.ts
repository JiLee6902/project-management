import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TaskReminderService } from './task-reminder.service';

@Injectable()
export class TaskReminderCron {
  constructor(private readonly taskReminderService: TaskReminderService) {}

  /**
   * Run every day at 8:00 AM (Asia/Ho_Chi_Minh timezone)
   * Send reminder emails for tasks due today
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM, {
    name: 'task-due-reminder',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleTaskDueReminder() {
    console.log('Starting task due reminder cron job...');

    try {
      await this.taskReminderService.sendDueTaskReminders();
      console.log('Task due reminder cron job completed successfully');
    } catch (error) {
      console.error('Task due reminder cron job failed:', error);
    }
  }
}
