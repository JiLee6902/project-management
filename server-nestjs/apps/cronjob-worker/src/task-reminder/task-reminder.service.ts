import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Task, TaskStatus } from '@app/entity/entities';
import { QueueService } from '@app/external-infra';

@Injectable()
export class TaskReminderService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly queueService: QueueService,
  ) {}

  async sendDueTaskReminders(): Promise<void> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const dueTasks = await this.taskRepository.find({
      where: {
        dueDate: Between(startOfDay, endOfDay),
        status: TaskStatus.TODO,
      },
      relations: ['assignee', 'project'],
    });

    console.log(`Found ${dueTasks.length} tasks due today`);

    for (const task of dueTasks) {
      if (task.assignee && task.assignee.email) {
        try {
          await this.queueService.addTaskReminderEmailJob({
            to: task.assignee.email,
            userName: task.assignee.name || task.assignee.email,
            taskTitle: task.title,
            projectName: task.project?.name || 'Unknown Project',
            dueDate: task.dueDate,
          });

          console.log(`Queued reminder email for task "${task.title}" to ${task.assignee.email}`);
        } catch (error) {
          console.error(`Failed to queue reminder for task ${task.id}:`, error);
        }
      }
    }
        
    const inProgressTasks = await this.taskRepository.find({
      where: {
        dueDate: Between(startOfDay, endOfDay),
        status: TaskStatus.IN_PROGRESS,
      },
      relations: ['assignee', 'project'],
    });

    console.log(`Found ${inProgressTasks.length} in-progress tasks due today`);

    for (const task of inProgressTasks) {
      if (task.assignee && task.assignee.email) {
        try {
          await this.queueService.addTaskReminderEmailJob({
            to: task.assignee.email,
            userName: task.assignee.name || task.assignee.email,
            taskTitle: task.title,
            projectName: task.project?.name || 'Unknown Project',
            dueDate: task.dueDate,
          });

          console.log(`Queued reminder email for in-progress task "${task.title}" to ${task.assignee.email}`);
        } catch (error) {
          console.error(`Failed to queue reminder for task ${task.id}:`, error);
        }
      }
    }
  }
}
