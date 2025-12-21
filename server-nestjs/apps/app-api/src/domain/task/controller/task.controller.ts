import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { User, CurrentUser } from '@app/shared-libs';
import { CreateTaskDto, UpdateTaskDto, DeleteTasksDto, UpdateTaskLabelsDto, CreateSubtaskDto, UpdateSubtaskDto, ReorderSubtasksDto } from '../dto';
import { CreateTaskCommand, UpdateTaskCommand, DeleteTasksCommand } from '../commands';
import { GetTaskQuery, GetTasksByProjectQuery } from '../queries';
import { TaskRepository } from '../repository/task.repository';
import { TaskService } from '../service/task.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly taskRepository: TaskRepository,
    private readonly taskService: TaskService,
  ) {}

  @Get('my/assigned')
  async getMyTasks(@User() user: CurrentUser) {
    return this.taskService.getMyTasks(user.id);
  }

  @Get('workload/:workspaceId')
  async getWorkload(@Param('workspaceId') workspaceId: string) {
    return this.taskService.getWorkload(workspaceId);
  }

  @Get(':id')
  async getTask(@Param('id') id: string) {
    return this.queryBus.execute(new GetTaskQuery(id));
  }

  @Get('project/:projectId')
  async getTasksByProject(@Param('projectId') projectId: string) {
    return this.queryBus.execute(new GetTasksByProjectQuery(projectId));
  }

  @Post()
  async createTask(
    @User() user: CurrentUser,
    @Body() dto: CreateTaskDto,
  ) {
    return this.commandBus.execute(new CreateTaskCommand(user.id, dto));
  }

  @Put(':id')
  async updateTask(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.commandBus.execute(new UpdateTaskCommand(user.id, id, dto));
  }

  @Post('delete')
  async deleteTasks(
    @User() user: CurrentUser,
    @Body() dto: DeleteTasksDto,
  ) {
    return this.commandBus.execute(new DeleteTasksCommand(user.id, dto));
  }

  @Put(':id/labels')
  async updateTaskLabels(
    @Param('id') id: string,
    @Body() dto: UpdateTaskLabelsDto,
  ) {
    const task = await this.taskRepository.setLabels(id, dto.labelIds);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return { task, message: 'Labels updated successfully' };
  }

  @Get(':taskId/subtasks')
  async getSubtasks(@Param('taskId') taskId: string) {
    const subtasks = await this.taskRepository.findSubtasksByTask(taskId);
    return { subtasks };
  }

  @Post('subtasks')
  async createSubtask(@Body() dto: CreateSubtaskDto) {
    const subtask = await this.taskRepository.createSubtask({
      taskId: dto.taskId,
      title: dto.title,
      completed: dto.completed ?? false,
    });
    return { subtask, message: 'Subtask created successfully' };
  }

  @Put('subtasks/:id')
  async updateSubtask(
    @Param('id') id: string,
    @Body() dto: UpdateSubtaskDto,
  ) {
    const subtask = await this.taskRepository.updateSubtask(id, dto);
    if (!subtask) {
      throw new NotFoundException('Subtask not found');
    }
    return { subtask, message: 'Subtask updated successfully' };
  }

  @Put('subtasks/:id/toggle')
  async toggleSubtask(@Param('id') id: string) {
    const subtask = await this.taskRepository.toggleSubtaskCompleted(id);
    if (!subtask) {
      throw new NotFoundException('Subtask not found');
    }
    return { subtask, message: 'Subtask toggled successfully' };
  }

  @Delete('subtasks/:id')
  async deleteSubtask(@Param('id') id: string) {
    await this.taskRepository.deleteSubtask(id);
    return { message: 'Subtask deleted successfully' };
  }

  @Put(':taskId/subtasks/reorder')
  async reorderSubtasks(
    @Param('taskId') taskId: string,
    @Body() dto: ReorderSubtasksDto,
  ) {
    await this.taskRepository.reorderSubtasks(dto.subtaskIds);
    const subtasks = await this.taskRepository.findSubtasksByTask(taskId);
    return { subtasks, message: 'Subtasks reordered successfully' };
  }

  // Duplicate task
  @Post(':id/duplicate')
  async duplicateTask(
    @User() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.taskService.duplicateTask(user.id, id);
  }

  // Create task from template
  @Post('from-template/:templateId')
  async createFromTemplate(
    @User() user: CurrentUser,
    @Param('templateId') templateId: string,
    @Body() dto: { projectId: string; assigneeId?: string; dueDate?: string },
  ) {
    return this.taskService.createFromTemplate(user.id, templateId, dto);
  }

  // Export tasks
  @Get('export/project/:projectId')
  async exportTasks(@Param('projectId') projectId: string) {
    return this.taskService.exportTasks(projectId);
  }

  // Import tasks
  @Post('import/project/:projectId')
  async importTasks(
    @User() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Body() dto: { tasks: any[] },
  ) {
    return this.taskService.importTasks(user.id, projectId, dto.tasks);
  }

  // ========== TASK DEPENDENCIES ==========

  @Get(':taskId/dependencies')
  async getTaskDependencies(@Param('taskId') taskId: string) {
    return this.taskService.getTaskDependencies(taskId);
  }

  @Post(':taskId/dependencies')
  async addDependency(
    @User() user: CurrentUser,
    @Param('taskId') taskId: string,
    @Body() dto: { dependsOnTaskId: string; type: string },
  ) {
    return this.taskService.addDependency(user.id, taskId, dto.dependsOnTaskId, dto.type);
  }

  @Delete('dependencies/:dependencyId')
  async removeDependency(@Param('dependencyId') dependencyId: string) {
    return this.taskService.removeDependency(dependencyId);
  }

  // ========== TASK WATCHERS ==========

  @Get(':taskId/watchers')
  async getTaskWatchers(@Param('taskId') taskId: string) {
    return this.taskService.getTaskWatchers(taskId);
  }

  @Post(':taskId/watchers')
  async addWatcher(
    @User() user: CurrentUser,
    @Param('taskId') taskId: string,
  ) {
    return this.taskService.addWatcher(taskId, user.id);
  }

  @Delete(':taskId/watchers')
  async removeWatcher(
    @User() user: CurrentUser,
    @Param('taskId') taskId: string,
  ) {
    return this.taskService.removeWatcher(taskId, user.id);
  }

  // ========== BULK ACTIONS ==========

  @Post('bulk/update')
  async bulkUpdateTasks(
    @User() user: CurrentUser,
    @Body() dto: { taskIds: string[]; updates: { status?: string; priority?: string; assigneeId?: string; sprintId?: string } },
  ) {
    return this.taskService.bulkUpdateTasks(user.id, dto.taskIds, dto.updates);
  }

  @Post('bulk/move')
  async bulkMoveTasks(
    @User() user: CurrentUser,
    @Body() dto: { taskIds: string[]; targetProjectId: string },
  ) {
    return this.taskService.bulkMoveTasks(user.id, dto.taskIds, dto.targetProjectId);
  }
}
