import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DeleteTasksCommand } from '../delete-tasks.command';
import { TaskRepository } from '../../repository/task.repository';
import { TasksDeletedEvent } from '../../events/tasks-deleted.event';

@CommandHandler(DeleteTasksCommand)
export class DeleteTasksHandler implements ICommandHandler<DeleteTasksCommand> {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteTasksCommand) {
    const { userId, dto } = command;

    if (!dto.taskIds?.length) {
      throw new BadRequestException('Task IDs are required');
    }

    const tasks = await this.taskRepository.findByIds(dto.taskIds);
    if (tasks.length !== dto.taskIds.length) {
      throw new NotFoundException('One or more tasks not found');
    }

    const projectId = tasks[0].projectId;
    const allSameProject = tasks.every(task => task.projectId === projectId);
    if (!allSameProject) {
      throw new BadRequestException('All tasks must belong to the same project');
    }

    const project = await this.taskRepository.findProject(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isAdmin = await this.taskRepository.isWorkspaceAdmin(project.workspaceId, userId);
    if (!isAdmin && project.teamLead !== userId) {
      throw new ForbiddenException('Only workspace admin or team lead can delete tasks');
    }

    await this.taskRepository.deleteMany(dto.taskIds);

    this.eventBus.publish(new TasksDeletedEvent(dto.taskIds, projectId, project.workspaceId));

    return { message: 'Tasks deleted successfully' };
  }
}
