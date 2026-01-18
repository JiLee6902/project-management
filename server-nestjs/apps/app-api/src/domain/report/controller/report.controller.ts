import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guard';
import { ReportService } from '../service/report.service';
import {
  ReportQueryDto,
  DashboardOverviewDto,
  SprintBurndownDto,
  MemberProductivityDto,
  TimeTrackingSummaryDto,
  TaskTrendDto,
  ProjectReportDto,
} from '../dto';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('dashboard/:projectId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get dashboard overview for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard overview data',
    type: DashboardOverviewDto,
  })
  async getDashboardOverview(
    @Param('projectId') projectId: string,
  ): Promise<DashboardOverviewDto> {
    return this.reportService.getDashboardOverview(projectId);
  }

  @Get('burndown/:sprintId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get burndown chart data for a sprint' })
  @ApiParam({ name: 'sprintId', description: 'Sprint ID' })
  @ApiResponse({
    status: 200,
    description: 'Sprint burndown chart data',
    type: SprintBurndownDto,
  })
  async getSprintBurndown(
    @Param('sprintId') sprintId: string,
  ): Promise<SprintBurndownDto> {
    return this.reportService.getSprintBurndown(sprintId);
  }

  @Get('productivity/:projectId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get member productivity report for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Member productivity data',
    type: [MemberProductivityDto],
  })
  async getMemberProductivity(
    @Param('projectId') projectId: string,
  ): Promise<MemberProductivityDto[]> {
    return this.reportService.getMemberProductivity(projectId);
  }

  @Get('time-tracking')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get time tracking summary' })
  @ApiResponse({
    status: 200,
    description: 'Time tracking summary data',
    type: TimeTrackingSummaryDto,
  })
  async getTimeTrackingSummary(
    @Query() query: ReportQueryDto,
  ): Promise<TimeTrackingSummaryDto> {
    return this.reportService.getTimeTrackingSummary(query);
  }

  @Get('trends')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get task trends over time' })
  @ApiResponse({
    status: 200,
    description: 'Task trend data',
    type: [TaskTrendDto],
  })
  async getTaskTrends(@Query() query: ReportQueryDto): Promise<TaskTrendDto[]> {
    return this.reportService.getTaskTrends(query);
  }

  @Get('full/:projectId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get full project report' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'period', required: false, enum: ['TODAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Full project report',
    type: ProjectReportDto,
  })
  async getFullProjectReport(
    @Param('projectId') projectId: string,
    @Query() query: ReportQueryDto,
  ): Promise<ProjectReportDto> {
    query.projectId = projectId;
    return this.reportService.getFullProjectReport(query);
  }
}
