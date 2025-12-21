import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { User, CurrentUser } from '@app/shared-libs';
import { SprintService } from './sprint.service';
import { CreateSprintDto, UpdateSprintDto, AddTasksToSprintDto } from './dto';

@Controller('sprints')
@UseGuards(JwtAuthGuard)
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @Get('project/:projectId')
  async getSprintsByProject(@Param('projectId') projectId: string) {
    return this.sprintService.getSprintsByProject(projectId);
  }

  @Get(':id')
  async getSprint(@Param('id') id: string) {
    return this.sprintService.getSprintById(id);
  }

  @Get(':id/tasks')
  async getSprintTasks(@Param('id') id: string) {
    return this.sprintService.getSprintTasks(id);
  }

  @Get(':id/burndown')
  async getBurndownData(@Param('id') id: string) {
    return this.sprintService.getBurndownData(id);
  }

  @Post()
  async createSprint(
    @User() user: CurrentUser,
    @Body() dto: CreateSprintDto,
  ) {
    return this.sprintService.createSprint(user.id, dto);
  }

  @Put(':id')
  async updateSprint(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateSprintDto,
  ) {
    return this.sprintService.updateSprint(user.id, id, dto);
  }

  @Put(':id/start')
  async startSprint(
    @User() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.sprintService.startSprint(user.id, id);
  }

  @Put(':id/complete')
  async completeSprint(
    @User() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.sprintService.completeSprint(user.id, id);
  }

  @Put(':id/tasks')
  async addTasksToSprint(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: AddTasksToSprintDto,
  ) {
    return this.sprintService.addTasksToSprint(user.id, id, dto.taskIds);
  }

  @Delete(':id/tasks/:taskId')
  async removeTaskFromSprint(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Param('taskId') taskId: string,
  ) {
    return this.sprintService.removeTaskFromSprint(user.id, id, taskId);
  }

  @Delete(':id')
  async deleteSprint(
    @User() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.sprintService.deleteSprint(user.id, id);
  }
}
