import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sprint, Task, TaskStatus } from '@app/entity/entities';
import { RedisCacheService } from '@app/external-infra';
import { ReportRepository } from '../repository/report.repository';
import {
  ReportQueryDto,
  ReportPeriod,
  DashboardOverviewDto,
  SprintBurndownDto,
  BurndownDataPointDto,
  MemberProductivityDto,
  TimeTrackingSummaryDto,
  TaskTrendDto,
  ProjectReportDto,
} from '../dto';

@Injectable()
export class ReportService {
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly redisCacheService: RedisCacheService,
    @InjectRepository(Sprint)
    private readonly sprintRepository: Repository<Sprint>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async getDashboardOverview(projectId: string): Promise<DashboardOverviewDto> {
    const cacheKey = `report:dashboard:${projectId}`;
    const cached = await this.redisCacheService.get<DashboardOverviewDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const [
      tasksByStatus,
      tasksByPriority,
      tasksByType,
      overdueTasks,
      tasksDueToday,
      tasksDueThisWeek,
      avgCompletionTime,
    ] = await Promise.all([
      this.reportRepository.getTaskCountsByStatus(projectId),
      this.reportRepository.getTaskCountsByPriority(projectId),
      this.reportRepository.getTaskCountsByType(projectId),
      this.reportRepository.getOverdueTasks(projectId),
      this.reportRepository.getTasksDueToday(projectId),
      this.reportRepository.getTasksDueThisWeek(projectId),
      this.reportRepository.getAverageCompletionTime(projectId),
    ]);

    const totalTasks = Object.values(tasksByStatus).reduce((a, b) => a + b, 0);
    const completedTasks = tasksByStatus.DONE || 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const result: DashboardOverviewDto = {
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksDueToday,
      tasksDueThisWeek,
      tasksByStatus: {
        TODO: tasksByStatus.TODO || 0,
        IN_PROGRESS: tasksByStatus.IN_PROGRESS || 0,
        DONE: tasksByStatus.DONE || 0,
      },
      tasksByPriority: {
        LOW: tasksByPriority.LOW || 0,
        MEDIUM: tasksByPriority.MEDIUM || 0,
        HIGH: tasksByPriority.HIGH || 0,
      },
      tasksByType: {
        TASK: tasksByType.TASK || 0,
        BUG: tasksByType.BUG || 0,
        FEATURE: tasksByType.FEATURE || 0,
        IMPROVEMENT: tasksByType.IMPROVEMENT || 0,
        OTHER: tasksByType.OTHER || 0,
      },
      completionRate: Math.round(completionRate * 100) / 100,
      averageCompletionTime: Math.round(avgCompletionTime * 100) / 100,
    };

    await this.redisCacheService.set(cacheKey, result, { ttl: this.CACHE_TTL });
    return result;
  }

  async getSprintBurndown(sprintId: string): Promise<SprintBurndownDto> {
    const cacheKey = `report:burndown:${sprintId}`;
    const cached = await this.redisCacheService.get<SprintBurndownDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const sprint = await this.sprintRepository.findOne({ where: { id: sprintId } });
    if (!sprint) {
      throw new Error('Sprint not found');
    }

    const tasks = await this.reportRepository.getSprintTasks(sprintId);
    const totalStoryPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const completedStoryPoints = tasks
      .filter((task) => task.status === TaskStatus.DONE)
      .reduce((sum, task) => sum + (task.storyPoints || 0), 0);

    const burndownData = await this.calculateBurndownData(sprint, tasks);

    const result: SprintBurndownDto = {
      sprintId: sprint.id,
      sprintName: sprint.name,
      totalStoryPoints,
      completedStoryPoints,
      remainingStoryPoints: totalStoryPoints - completedStoryPoints,
      startDate: sprint.startDate?.toISOString() || '',
      endDate: sprint.endDate?.toISOString() || '',
      burndownData,
    };

    await this.redisCacheService.set(cacheKey, result, { ttl: this.CACHE_TTL });
    return result;
  }

  private async calculateBurndownData(sprint: Sprint, tasks: Task[]): Promise<BurndownDataPointDto[]> {
    if (!sprint.startDate || !sprint.endDate) {
      return [];
    }

    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalStoryPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

    const completedByDate = await this.reportRepository.getSprintCompletedTasksByDate(
      sprint.id,
      startDate,
      endDate,
    );

    const completedMap = new Map<string, number>();
    completedByDate.forEach((row) => {
      const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date;
      completedMap.set(dateStr, parseInt(row.storyPoints || '0', 10));
    });

    const burndownData: BurndownDataPointDto[] = [];
    let cumulativeCompleted = 0;

    for (let i = 0; i <= totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      const completedOnDay = completedMap.get(dateStr) || 0;
      cumulativeCompleted += completedOnDay;

      const idealRemaining = totalStoryPoints - (totalStoryPoints / totalDays) * i;
      const actualRemaining = totalStoryPoints - cumulativeCompleted;

      burndownData.push({
        date: dateStr,
        idealRemaining: Math.round(idealRemaining * 100) / 100,
        actualRemaining,
        completedOnDay,
      });
    }

    return burndownData;
  }

  async getMemberProductivity(projectId: string): Promise<MemberProductivityDto[]> {
    const cacheKey = `report:productivity:${projectId}`;
    const cached = await this.redisCacheService.get<MemberProductivityDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const rawData = await this.reportRepository.getMemberProductivity(projectId);

    const result: MemberProductivityDto[] = rawData.map((row) => {
      const tasksAssigned = parseInt(row.tasksAssigned || '0', 10);
      const tasksCompleted = parseInt(row.tasksCompleted || '0', 10);
      const completionRate = tasksAssigned > 0 ? (tasksCompleted / tasksAssigned) * 100 : 0;

      return {
        userId: row.userId,
        userName: row.userName || 'Unknown',
        userEmail: row.userEmail || '',
        tasksAssigned,
        tasksCompleted,
        tasksInProgress: parseInt(row.tasksInProgress || '0', 10),
        completionRate: Math.round(completionRate * 100) / 100,
        totalLoggedTime: parseInt(row.totalLoggedTime || '0', 10),
        averageTaskCompletionTime: 0, // Can be calculated from activity logs
        storyPointsCompleted: parseInt(row.storyPointsCompleted || '0', 10),
      };
    });

    await this.redisCacheService.set(cacheKey, result, { ttl: this.CACHE_TTL });
    return result;
  }

  async getTimeTrackingSummary(query: ReportQueryDto): Promise<TimeTrackingSummaryDto> {
    const { projectId, startDate, endDate } = query;
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    const { start, end } = this.getDateRange(query);
    const cacheKey = `report:timetracking:${projectId}:${start.toISOString()}:${end.toISOString()}`;

    const cached = await this.redisCacheService.get<TimeTrackingSummaryDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.reportRepository.getTimeTrackingSummary(projectId, start, end);

    const efficiency = data.totalEstimatedTime > 0
      ? (data.totalLoggedTime / data.totalEstimatedTime) * 100
      : 0;

    const result: TimeTrackingSummaryDto = {
      totalLoggedTime: data.totalLoggedTime,
      totalEstimatedTime: data.totalEstimatedTime,
      efficiency: Math.round(efficiency * 100) / 100,
      timeByProject: { [projectId]: data.totalLoggedTime },
      timeByUser: data.timeByUser,
      timeByDay: data.timeByDay,
    };

    await this.redisCacheService.set(cacheKey, result, { ttl: this.CACHE_TTL });
    return result;
  }

  async getTaskTrends(query: ReportQueryDto): Promise<TaskTrendDto[]> {
    const { projectId } = query;
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    const { start, end } = this.getDateRange(query);
    const cacheKey = `report:trends:${projectId}:${start.toISOString()}:${end.toISOString()}`;

    const cached = await this.redisCacheService.get<TaskTrendDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const rawData = await this.reportRepository.getTaskTrends(projectId, start, end);

    let cumulative = 0;
    const result: TaskTrendDto[] = rawData.map((row) => {
      cumulative += row.created - row.completed;
      return {
        date: row.date,
        created: row.created,
        completed: row.completed,
        cumulative,
      };
    });

    await this.redisCacheService.set(cacheKey, result, { ttl: this.CACHE_TTL });
    return result;
  }

  async getFullProjectReport(query: ReportQueryDto): Promise<ProjectReportDto> {
    const { projectId } = query;
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    const [overview, memberProductivity, taskTrends, timeTracking] = await Promise.all([
      this.getDashboardOverview(projectId),
      this.getMemberProductivity(projectId),
      this.getTaskTrends(query),
      this.getTimeTrackingSummary(query),
    ]);

    return {
      overview,
      memberProductivity,
      taskTrends,
      timeTracking,
    };
  }

  private getDateRange(query: ReportQueryDto): { start: Date; end: Date } {
    if (query.startDate && query.endDate) {
      return {
        start: new Date(query.startDate),
        end: new Date(query.endDate),
      };
    }

    const end = new Date();
    const start = new Date();

    switch (query.period) {
      case ReportPeriod.TODAY:
        start.setHours(0, 0, 0, 0);
        break;
      case ReportPeriod.WEEK:
        start.setDate(start.getDate() - 7);
        break;
      case ReportPeriod.MONTH:
        start.setMonth(start.getMonth() - 1);
        break;
      case ReportPeriod.QUARTER:
        start.setMonth(start.getMonth() - 3);
        break;
      case ReportPeriod.YEAR:
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }

    return { start, end };
  }

  async invalidateCache(projectId: string): Promise<void> {
    // Delete exact keys
    await this.redisCacheService.del(`report:dashboard:${projectId}`);
    await this.redisCacheService.del(`report:productivity:${projectId}`);

    // Delete pattern-based keys
    await this.redisCacheService.delByPattern(`report:trends:${projectId}:*`);
    await this.redisCacheService.delByPattern(`report:timetracking:${projectId}:*`);
    await this.redisCacheService.delByPattern(`report:burndown:*`);
  }
}
