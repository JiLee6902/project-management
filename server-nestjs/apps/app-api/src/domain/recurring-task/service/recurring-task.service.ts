import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '@app/entity/entities';
import {
  RecurringTask,
  RecurrencePattern,
  RecurringTaskStatus,
} from '@app/entity/entities/recurring-task.entity';
import { RecurringTaskRepository } from '../repository/recurring-task.repository';
import { CreateRecurringTaskDto, UpdateRecurringTaskDto } from '../dto';
import * as cronParser from 'cron-parser';

@Injectable()
export class RecurringTaskService {
  constructor(
    private readonly recurringTaskRepository: RecurringTaskRepository,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(
    projectId: string,
    userId: string,
    dto: CreateRecurringTaskDto,
  ): Promise<RecurringTask> {
    const startDate = new Date(dto.startDate);
    const nextGenerationAt = this.calculateNextGeneration(
      dto.pattern,
      startDate,
      dto.cronExpression,
      dto.daysOfWeek,
      dto.dayOfMonth,
    );

    const recurringTask = await this.recurringTaskRepository.create({
      projectId,
      title: dto.title,
      description: dto.description,
      taskType: dto.taskType,
      priority: dto.priority,
      pattern: dto.pattern,
      cronExpression: dto.cronExpression,
      daysOfWeek: dto.daysOfWeek,
      dayOfMonth: dto.dayOfMonth,
      startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      dueDateOffset: dto.dueDateOffset || 0,
      estimatedTime: dto.estimatedTime,
      storyPoints: dto.storyPoints,
      skipWeekends: dto.skipWeekends || false,
      assigneeId: dto.assigneeId,
      sprintId: dto.sprintId,
      labelIds: dto.labelIds,
      nextGenerationAt,
      createdBy: userId,
    });

    return recurringTask;
  }

  async findById(id: string): Promise<RecurringTask> {
    const recurringTask = await this.recurringTaskRepository.findById(id);
    if (!recurringTask) {
      throw new NotFoundException('Recurring task not found');
    }
    return recurringTask;
  }

  async findByProject(projectId: string): Promise<RecurringTask[]> {
    return this.recurringTaskRepository.findByProject(projectId);
  }

  async update(id: string, dto: UpdateRecurringTaskDto): Promise<RecurringTask> {
    const existing = await this.findById(id);

    const updateData: Partial<RecurringTask> = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.taskType) updateData.taskType = dto.taskType;
    if (dto.priority) updateData.priority = dto.priority;
    if (dto.pattern) updateData.pattern = dto.pattern;
    if (dto.cronExpression !== undefined) updateData.cronExpression = dto.cronExpression;
    if (dto.daysOfWeek !== undefined) updateData.daysOfWeek = dto.daysOfWeek;
    if (dto.dayOfMonth !== undefined) updateData.dayOfMonth = dto.dayOfMonth;
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    if (dto.dueDateOffset !== undefined) updateData.dueDateOffset = dto.dueDateOffset;
    if (dto.estimatedTime !== undefined) updateData.estimatedTime = dto.estimatedTime;
    if (dto.storyPoints !== undefined) updateData.storyPoints = dto.storyPoints;
    if (dto.skipWeekends !== undefined) updateData.skipWeekends = dto.skipWeekends;
    if (dto.assigneeId !== undefined) updateData.assigneeId = dto.assigneeId;
    if (dto.sprintId !== undefined) updateData.sprintId = dto.sprintId;
    if (dto.labelIds !== undefined) updateData.labelIds = dto.labelIds;
    if (dto.status) updateData.status = dto.status;

    // Recalculate next generation if pattern changed
    if (dto.pattern || dto.cronExpression || dto.daysOfWeek || dto.dayOfMonth) {
      const pattern = dto.pattern || existing.pattern;
      const startDate = dto.startDate ? new Date(dto.startDate) : existing.startDate;
      updateData.nextGenerationAt = this.calculateNextGeneration(
        pattern,
        startDate,
        dto.cronExpression || existing.cronExpression,
        dto.daysOfWeek || existing.daysOfWeek,
        dto.dayOfMonth || existing.dayOfMonth,
      );
    }

    const updated = await this.recurringTaskRepository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException('Recurring task not found');
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.recurringTaskRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Recurring task not found');
    }
  }

  async pause(id: string): Promise<RecurringTask> {
    return this.update(id, { status: RecurringTaskStatus.PAUSED });
  }

  async resume(id: string): Promise<RecurringTask> {
    const existing = await this.findById(id);
    const nextGenerationAt = this.calculateNextGeneration(
      existing.pattern,
      new Date(),
      existing.cronExpression,
      existing.daysOfWeek,
      existing.dayOfMonth,
    );

    const updated = await this.recurringTaskRepository.update(id, {
      status: RecurringTaskStatus.ACTIVE,
      nextGenerationAt,
    });

    if (!updated) {
      throw new NotFoundException('Recurring task not found');
    }
    return updated;
  }

  async generateTaskNow(id: string): Promise<Task> {
    const recurringTask = await this.findById(id);
    return this.createTaskFromRecurring(recurringTask);
  }

  async processRecurringTasks(): Promise<number> {
    const dueRecurringTasks = await this.recurringTaskRepository.findDueForGeneration();
    let generated = 0;

    for (const recurringTask of dueRecurringTasks) {
      try {
        // Check if end date has passed
        if (recurringTask.endDate && new Date() > recurringTask.endDate) {
          await this.recurringTaskRepository.update(recurringTask.id, {
            status: RecurringTaskStatus.COMPLETED,
          });
          continue;
        }

        await this.createTaskFromRecurring(recurringTask);

        // Calculate next generation time
        const nextGenerationAt = this.calculateNextGeneration(
          recurringTask.pattern,
          new Date(),
          recurringTask.cronExpression,
          recurringTask.daysOfWeek,
          recurringTask.dayOfMonth,
        );

        await this.recurringTaskRepository.updateGenerationTimestamps(
          recurringTask.id,
          new Date(),
          nextGenerationAt,
        );
        await this.recurringTaskRepository.incrementTasksGenerated(recurringTask.id);

        generated++;
      } catch (error) {
        console.error(`Failed to generate task for recurring task ${recurringTask.id}:`, error);
      }
    }

    return generated;
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

  private calculateNextGeneration(
    pattern: RecurrencePattern,
    fromDate: Date,
    cronExpression?: string,
    daysOfWeek?: number[],
    dayOfMonth?: number,
  ): Date {
    const now = new Date();
    const baseDate = fromDate > now ? fromDate : now;

    switch (pattern) {
      case RecurrencePattern.DAILY: {
        const next = new Date(baseDate);
        next.setDate(next.getDate() + 1);
        next.setHours(9, 0, 0, 0); // 9 AM
        return next;
      }

      case RecurrencePattern.WEEKLY: {
        const next = new Date(baseDate);
        if (daysOfWeek && daysOfWeek.length > 0) {
          // Find next day in daysOfWeek
          let found = false;
          for (let i = 1; i <= 7; i++) {
            next.setDate(baseDate.getDate() + i);
            if (daysOfWeek.includes(next.getDay())) {
              found = true;
              break;
            }
          }
          if (!found) {
            next.setDate(baseDate.getDate() + 7);
          }
        } else {
          next.setDate(next.getDate() + 7);
        }
        next.setHours(9, 0, 0, 0);
        return next;
      }

      case RecurrencePattern.BIWEEKLY: {
        const next = new Date(baseDate);
        next.setDate(next.getDate() + 14);
        next.setHours(9, 0, 0, 0);
        return next;
      }

      case RecurrencePattern.MONTHLY: {
        const next = new Date(baseDate);
        next.setMonth(next.getMonth() + 1);
        if (dayOfMonth) {
          const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
          next.setDate(Math.min(dayOfMonth, lastDay));
        }
        next.setHours(9, 0, 0, 0);
        return next;
      }

      case RecurrencePattern.QUARTERLY: {
        const next = new Date(baseDate);
        next.setMonth(next.getMonth() + 3);
        next.setHours(9, 0, 0, 0);
        return next;
      }

      case RecurrencePattern.YEARLY: {
        const next = new Date(baseDate);
        next.setFullYear(next.getFullYear() + 1);
        next.setHours(9, 0, 0, 0);
        return next;
      }

      case RecurrencePattern.CUSTOM: {
        if (cronExpression) {
          try {
            const interval = cronParser.parseExpression(cronExpression, {
              currentDate: baseDate,
            });
            return interval.next().toDate();
          } catch {
            // Fallback to daily if cron parsing fails
            const next = new Date(baseDate);
            next.setDate(next.getDate() + 1);
            return next;
          }
        }
        const next = new Date(baseDate);
        next.setDate(next.getDate() + 1);
        return next;
      }

      default:
        const next = new Date(baseDate);
        next.setDate(next.getDate() + 7);
        return next;
    }
  }
}
