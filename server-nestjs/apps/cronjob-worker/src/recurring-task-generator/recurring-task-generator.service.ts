import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Task, TaskStatus } from '@app/entity/entities';
import {
  RecurringTask,
  RecurrencePattern,
  RecurringTaskStatus,
} from '@app/entity/entities/recurring-task.entity';

@Injectable()
export class RecurringTaskGeneratorService {
  private readonly logger = new Logger(RecurringTaskGeneratorService.name);

  constructor(
    @InjectRepository(RecurringTask)
    private readonly recurringTaskRepository: Repository<RecurringTask>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processRecurringTasks(): Promise<void> {
    this.logger.log('Processing recurring tasks...');

    const now = new Date();
    const dueRecurringTasks = await this.recurringTaskRepository.find({
      where: {
        status: RecurringTaskStatus.ACTIVE,
        nextGenerationAt: LessThanOrEqual(now),
      },
    });

    this.logger.log(`Found ${dueRecurringTasks.length} recurring tasks due for generation`);

    let generated = 0;
    let failed = 0;

    for (const recurringTask of dueRecurringTasks) {
      try {
        // Check if end date has passed
        if (recurringTask.endDate && now > recurringTask.endDate) {
          await this.recurringTaskRepository.update(recurringTask.id, {
            status: RecurringTaskStatus.COMPLETED,
          });
          this.logger.log(`Recurring task ${recurringTask.id} completed (end date passed)`);
          continue;
        }

        // Create the task
        await this.createTaskFromRecurring(recurringTask);

        // Calculate next generation time
        const nextGenerationAt = this.calculateNextGeneration(recurringTask);

        // Update timestamps
        await this.recurringTaskRepository.update(recurringTask.id, {
          lastGeneratedAt: now,
          nextGenerationAt,
          tasksGenerated: recurringTask.tasksGenerated + 1,
        });

        generated++;
        this.logger.log(`Generated task from recurring task ${recurringTask.id}`);
      } catch (error) {
        failed++;
        this.logger.error(`Failed to generate task for recurring task ${recurringTask.id}:`, error);
      }
    }

    this.logger.log(`Recurring tasks processed: ${generated} generated, ${failed} failed`);
  }

  private async createTaskFromRecurring(recurringTask: RecurringTask): Promise<Task> {
    let dueDate: Date | undefined;
    if (recurringTask.dueDateOffset > 0) {
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + recurringTask.dueDateOffset);

      // Skip weekends if enabled
      if (recurringTask.skipWeekends) {
        while (dueDate.getDay() === 0 || dueDate.getDay() === 6) {
          dueDate.setDate(dueDate.getDate() + 1);
        }
      }
    }

    const task = this.taskRepository.create({
      projectId: recurringTask.projectId,
      title: recurringTask.title,
      description: recurringTask.description,
      type: recurringTask.taskType,
      priority: recurringTask.priority,
      status: TaskStatus.TODO,
      assigneeId: recurringTask.assigneeId,
      sprintId: recurringTask.sprintId,
      estimatedTime: recurringTask.estimatedTime || 0,
      storyPoints: recurringTask.storyPoints,
      dueDate,
      isRecurring: true,
      createdBy: recurringTask.createdBy,
    });

    return this.taskRepository.save(task);
  }

  private calculateNextGeneration(recurringTask: RecurringTask): Date {
    const now = new Date();

    switch (recurringTask.pattern) {
      case RecurrencePattern.DAILY: {
        const next = new Date(now);
        next.setDate(next.getDate() + 1);
        next.setHours(9, 0, 0, 0);
        return next;
      }

      case RecurrencePattern.WEEKLY: {
        const next = new Date(now);
        if (recurringTask.daysOfWeek && recurringTask.daysOfWeek.length > 0) {
          for (let i = 1; i <= 7; i++) {
            next.setDate(now.getDate() + i);
            if (recurringTask.daysOfWeek.includes(next.getDay())) {
              break;
            }
          }
        } else {
          next.setDate(next.getDate() + 7);
        }
        next.setHours(9, 0, 0, 0);
        return next;
      }

      case RecurrencePattern.BIWEEKLY: {
        const next = new Date(now);
        next.setDate(next.getDate() + 14);
        next.setHours(9, 0, 0, 0);
        return next;
      }

      case RecurrencePattern.MONTHLY: {
        const next = new Date(now);
        next.setMonth(next.getMonth() + 1);
        if (recurringTask.dayOfMonth) {
          const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
          next.setDate(Math.min(recurringTask.dayOfMonth, lastDay));
        }
        next.setHours(9, 0, 0, 0);
        return next;
      }

      case RecurrencePattern.QUARTERLY: {
        const next = new Date(now);
        next.setMonth(next.getMonth() + 3);
        next.setHours(9, 0, 0, 0);
        return next;
      }

      case RecurrencePattern.YEARLY: {
        const next = new Date(now);
        next.setFullYear(next.getFullYear() + 1);
        next.setHours(9, 0, 0, 0);
        return next;
      }

      case RecurrencePattern.CUSTOM: {
        // For custom, try to parse cron expression
        // Simplified: just add 1 day for now
        const next = new Date(now);
        next.setDate(next.getDate() + 1);
        next.setHours(9, 0, 0, 0);
        return next;
      }

      default:
        const next = new Date(now);
        next.setDate(next.getDate() + 7);
        next.setHours(9, 0, 0, 0);
        return next;
    }
  }
}
