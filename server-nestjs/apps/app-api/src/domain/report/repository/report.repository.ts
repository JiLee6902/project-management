import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThanOrEqual } from 'typeorm';
import { Task, TaskStatus, TimeEntry, Activity, ActivityType } from '@app/entity/entities';

@Injectable()
export class ReportRepository {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TimeEntry)
    private readonly timeEntryRepository: Repository<TimeEntry>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async getTaskCountsByStatus(projectId: string): Promise<Record<string, number>> {
    const result = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('task.projectId = :projectId', { projectId })
      .groupBy('task.status')
      .getRawMany();

    const counts: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };

    result.forEach((row) => {
      counts[row.status] = parseInt(row.count, 10);
    });

    return counts;
  }

  async getTaskCountsByPriority(projectId: string): Promise<Record<string, number>> {
    const result = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .where('task.projectId = :projectId', { projectId })
      .groupBy('task.priority')
      .getRawMany();

    const counts: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    };

    result.forEach((row) => {
      counts[row.priority] = parseInt(row.count, 10);
    });

    return counts;
  }

  async getTaskCountsByType(projectId: string): Promise<Record<string, number>> {
    const result = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('task.projectId = :projectId', { projectId })
      .groupBy('task.type')
      .getRawMany();

    const counts: Record<string, number> = {
      TASK: 0,
      BUG: 0,
      FEATURE: 0,
      IMPROVEMENT: 0,
      OTHER: 0,
    };

    result.forEach((row) => {
      counts[row.type] = parseInt(row.count, 10);
    });

    return counts;
  }

  async getOverdueTasks(projectId: string): Promise<number> {
    const now = new Date();
    return this.taskRepository.count({
      where: {
        projectId,
        dueDate: LessThan(now),
        status: TaskStatus.TODO,
      },
    });
  }

  async getTasksDueToday(projectId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.taskRepository.count({
      where: {
        projectId,
        dueDate: Between(today, tomorrow),
      },
    });
  }

  async getTasksDueThisWeek(projectId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

    return this.taskRepository.count({
      where: {
        projectId,
        dueDate: Between(today, endOfWeek),
      },
    });
  }

  async getAverageCompletionTime(projectId: string): Promise<number> {
    const result = await this.activityRepository
      .createQueryBuilder('activity')
      .select('AVG(EXTRACT(EPOCH FROM (activity.createdAt - task.createdAt)) / 3600)', 'avgHours')
      .innerJoin('tasks', 'task', 'activity.taskId = task.id')
      .where('activity.projectId = :projectId', { projectId })
      .andWhere('activity.type = :type', { type: ActivityType.TASK_STATUS_CHANGED })
      .andWhere('task.status = :status', { status: TaskStatus.DONE })
      .getRawOne();

    return result?.avgHours ? parseFloat(result.avgHours) : 0;
  }

  async getMemberProductivity(projectId: string): Promise<any[]> {
    const result = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.assigneeId', 'userId')
      .addSelect('user.name', 'userName')
      .addSelect('user.email', 'userEmail')
      .addSelect('COUNT(*)', 'tasksAssigned')
      .addSelect(`SUM(CASE WHEN task.status = '${TaskStatus.DONE}' THEN 1 ELSE 0 END)`, 'tasksCompleted')
      .addSelect(`SUM(CASE WHEN task.status = '${TaskStatus.IN_PROGRESS}' THEN 1 ELSE 0 END)`, 'tasksInProgress')
      .addSelect('COALESCE(SUM(task.loggedTime), 0)', 'totalLoggedTime')
      .addSelect(`COALESCE(SUM(CASE WHEN task.status = '${TaskStatus.DONE}' THEN task.storyPoints ELSE 0 END), 0)`, 'storyPointsCompleted')
      .innerJoin('users', 'user', 'task.assigneeId = user.id')
      .where('task.projectId = :projectId', { projectId })
      .andWhere('task.assigneeId IS NOT NULL')
      .groupBy('task.assigneeId')
      .addGroupBy('user.name')
      .addGroupBy('user.email')
      .getRawMany();

    return result;
  }

  async getSprintTasks(sprintId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { sprintId },
      order: { createdAt: 'ASC' },
    });
  }

  async getSprintCompletedTasksByDate(sprintId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const result = await this.activityRepository
      .createQueryBuilder('activity')
      .select('DATE(activity.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(task.storyPoints), 0)', 'storyPoints')
      .innerJoin('tasks', 'task', 'activity.taskId = task.id')
      .where('task.sprintId = :sprintId', { sprintId })
      .andWhere('activity.type = :type', { type: ActivityType.TASK_STATUS_CHANGED })
      .andWhere('activity.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('DATE(activity.createdAt)')
      .orderBy('DATE(activity.createdAt)', 'ASC')
      .getRawMany();

    return result;
  }

  async getTaskTrends(projectId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const createdTasks = await this.taskRepository
      .createQueryBuilder('task')
      .select('DATE(task.createdAt)', 'date')
      .addSelect('COUNT(*)', 'created')
      .where('task.projectId = :projectId', { projectId })
      .andWhere('task.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('DATE(task.createdAt)')
      .getRawMany();

    const completedTasks = await this.activityRepository
      .createQueryBuilder('activity')
      .select('DATE(activity.createdAt)', 'date')
      .addSelect('COUNT(*)', 'completed')
      .where('activity.projectId = :projectId', { projectId })
      .andWhere('activity.type = :type', { type: ActivityType.TASK_STATUS_CHANGED })
      .andWhere('activity.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('DATE(activity.createdAt)')
      .getRawMany();

    // Merge created and completed data
    const dateMap = new Map<string, { created: number; completed: number }>();

    createdTasks.forEach((row) => {
      const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date;
      dateMap.set(dateStr, { created: parseInt(row.created, 10), completed: 0 });
    });

    completedTasks.forEach((row) => {
      const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date;
      const existing = dateMap.get(dateStr) || { created: 0, completed: 0 };
      existing.completed = parseInt(row.completed, 10);
      dateMap.set(dateStr, existing);
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getTimeTrackingSummary(projectId: string, startDate: Date, endDate: Date): Promise<any> {
    const timeByUser = await this.timeEntryRepository
      .createQueryBuilder('te')
      .select('te.userId', 'userId')
      .addSelect('user.name', 'userName')
      .addSelect('SUM(te.duration)', 'totalTime')
      .innerJoin('tasks', 'task', 'te.taskId = task.id')
      .innerJoin('users', 'user', 'te.userId = user.id')
      .where('task.projectId = :projectId', { projectId })
      .andWhere('te.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('te.userId')
      .addGroupBy('user.name')
      .getRawMany();

    const timeByDay = await this.timeEntryRepository
      .createQueryBuilder('te')
      .select('DATE(te.createdAt)', 'date')
      .addSelect('SUM(te.duration)', 'totalTime')
      .innerJoin('tasks', 'task', 'te.taskId = task.id')
      .where('task.projectId = :projectId', { projectId })
      .andWhere('te.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('DATE(te.createdAt)')
      .getRawMany();

    const totalLoggedTime = timeByUser.reduce((sum, row) => sum + parseInt(row.totalTime || '0', 10), 0);

    const totalEstimated = await this.taskRepository
      .createQueryBuilder('task')
      .select('SUM(task.estimatedTime)', 'total')
      .where('task.projectId = :projectId', { projectId })
      .getRawOne();

    return {
      totalLoggedTime,
      totalEstimatedTime: parseInt(totalEstimated?.total || '0', 10),
      timeByUser: timeByUser.reduce((acc, row) => {
        acc[row.userName || row.userId] = parseInt(row.totalTime || '0', 10);
        return acc;
      }, {} as Record<string, number>),
      timeByDay: timeByDay.reduce((acc, row) => {
        const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date;
        acc[dateStr] = parseInt(row.totalTime || '0', 10);
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
