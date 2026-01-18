import { ApiProperty } from '@nestjs/swagger';

export class TaskStatusCountDto {
  @ApiProperty()
  TODO: number;

  @ApiProperty()
  IN_PROGRESS: number;

  @ApiProperty()
  DONE: number;
}

export class TaskPriorityCountDto {
  @ApiProperty()
  LOW: number;

  @ApiProperty()
  MEDIUM: number;

  @ApiProperty()
  HIGH: number;
}

export class TaskTypeCountDto {
  @ApiProperty()
  TASK: number;

  @ApiProperty()
  BUG: number;

  @ApiProperty()
  FEATURE: number;

  @ApiProperty()
  IMPROVEMENT: number;

  @ApiProperty()
  OTHER: number;
}

export class DashboardOverviewDto {
  @ApiProperty()
  totalTasks: number;

  @ApiProperty()
  completedTasks: number;

  @ApiProperty()
  overdueTasks: number;

  @ApiProperty()
  tasksDueToday: number;

  @ApiProperty()
  tasksDueThisWeek: number;

  @ApiProperty({ type: TaskStatusCountDto })
  tasksByStatus: TaskStatusCountDto;

  @ApiProperty({ type: TaskPriorityCountDto })
  tasksByPriority: TaskPriorityCountDto;

  @ApiProperty({ type: TaskTypeCountDto })
  tasksByType: TaskTypeCountDto;

  @ApiProperty()
  completionRate: number;

  @ApiProperty()
  averageCompletionTime: number; // in hours
}

export class BurndownDataPointDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  idealRemaining: number;

  @ApiProperty()
  actualRemaining: number;

  @ApiProperty()
  completedOnDay: number;
}

export class SprintBurndownDto {
  @ApiProperty()
  sprintId: string;

  @ApiProperty()
  sprintName: string;

  @ApiProperty()
  totalStoryPoints: number;

  @ApiProperty()
  completedStoryPoints: number;

  @ApiProperty()
  remainingStoryPoints: number;

  @ApiProperty()
  startDate: string;

  @ApiProperty()
  endDate: string;

  @ApiProperty({ type: [BurndownDataPointDto] })
  burndownData: BurndownDataPointDto[];
}

export class MemberProductivityDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  userEmail: string;

  @ApiProperty()
  tasksAssigned: number;

  @ApiProperty()
  tasksCompleted: number;

  @ApiProperty()
  tasksInProgress: number;

  @ApiProperty()
  completionRate: number;

  @ApiProperty()
  totalLoggedTime: number; // in minutes

  @ApiProperty()
  averageTaskCompletionTime: number; // in hours

  @ApiProperty()
  storyPointsCompleted: number;
}

export class TimeTrackingSummaryDto {
  @ApiProperty()
  totalLoggedTime: number; // in minutes

  @ApiProperty()
  totalEstimatedTime: number; // in minutes

  @ApiProperty()
  efficiency: number; // percentage

  @ApiProperty({ type: Object })
  timeByProject: Record<string, number>;

  @ApiProperty({ type: Object })
  timeByUser: Record<string, number>;

  @ApiProperty({ type: Object })
  timeByDay: Record<string, number>;
}

export class TaskTrendDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  created: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  cumulative: number;
}

export class ProjectReportDto {
  @ApiProperty({ type: DashboardOverviewDto })
  overview: DashboardOverviewDto;

  @ApiProperty({ type: [MemberProductivityDto] })
  memberProductivity: MemberProductivityDto[];

  @ApiProperty({ type: [TaskTrendDto] })
  taskTrends: TaskTrendDto[];

  @ApiProperty({ type: TimeTrackingSummaryDto })
  timeTracking: TimeTrackingSummaryDto;
}
