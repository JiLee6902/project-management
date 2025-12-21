import { Injectable } from '@nestjs/common';
import { ActivityRepository } from '../repository/activity.repository';
import { Activity, ActivityType } from '@app/entity/entities';
import { WebSocketService } from '@app/external-infra';

@Injectable()
export class ActivityService {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly webSocketService: WebSocketService,
  ) {}

  async logActivity(
    userId: string,
    projectId: string,
    type: ActivityType,
    options?: {
      taskId?: string;
      description?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<Activity | null> {
    const activity = await this.activityRepository.create({
      userId,
      projectId,
      type,
      taskId: options?.taskId,
      description: options?.description || this.getDefaultDescription(type),
      metadata: options?.metadata,
      createdBy: userId,
    });

    // Emit WebSocket event for real-time updates
    if (activity) {
      this.webSocketService.emitActivityAdded({
        activity,
        projectId,
        taskId: options?.taskId,
      });
    }

    return activity;
  }

  async getProjectActivities(
    projectId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ activities: Activity[]; total: number }> {
    const [activities, total] = await Promise.all([
      this.activityRepository.findByProject(projectId, limit, offset),
      this.activityRepository.countByProject(projectId),
    ]);
    return { activities, total };
  }

  async getTaskActivities(
    taskId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ activities: Activity[]; total: number }> {
    const [activities, total] = await Promise.all([
      this.activityRepository.findByTask(taskId, limit, offset),
      this.activityRepository.countByTask(taskId),
    ]);
    return { activities, total };
  }

  async getUserActivities(
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<Activity[]> {
    return this.activityRepository.findByUser(userId, limit, offset);
  }

  private getDefaultDescription(type: ActivityType): string {
    const descriptions: Record<ActivityType, string> = {
      [ActivityType.TASK_CREATED]: 'created a task',
      [ActivityType.TASK_UPDATED]: 'updated a task',
      [ActivityType.TASK_DELETED]: 'deleted a task',
      [ActivityType.TASK_STATUS_CHANGED]: 'changed task status',
      [ActivityType.TASK_PRIORITY_CHANGED]: 'changed task priority',
      [ActivityType.TASK_ASSIGNEE_CHANGED]: 'changed task assignee',
      [ActivityType.TASK_DUE_DATE_CHANGED]: 'changed task due date',
      [ActivityType.COMMENT_ADDED]: 'added a comment',
      [ActivityType.COMMENT_UPDATED]: 'updated a comment',
      [ActivityType.COMMENT_DELETED]: 'deleted a comment',
      [ActivityType.SUBTASK_ADDED]: 'added a subtask',
      [ActivityType.SUBTASK_COMPLETED]: 'completed a subtask',
      [ActivityType.SUBTASK_UNCOMPLETED]: 'uncompleted a subtask',
      [ActivityType.LABEL_ADDED]: 'added a label',
      [ActivityType.LABEL_REMOVED]: 'removed a label',
      [ActivityType.PROJECT_CREATED]: 'created a project',
      [ActivityType.PROJECT_UPDATED]: 'updated a project',
      [ActivityType.PROJECT_MEMBER_ADDED]: 'added a project member',
      [ActivityType.PROJECT_MEMBER_REMOVED]: 'removed a project member',
    };
    return descriptions[type] || 'performed an action';
  }
}
