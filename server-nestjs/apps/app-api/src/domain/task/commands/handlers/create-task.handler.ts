import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateTaskCommand } from '../create-task.command';
import { TaskRepository } from '../../repository/task.repository';
import { TaskCreatedEvent } from '../../events/task-created.event';
import { ActivityService } from '../../../activity/service/activity.service';
import { ActivityType } from '@app/entity/entities';

@CommandHandler(CreateTaskCommand)
export class CreateTaskHandler implements ICommandHandler<CreateTaskCommand> {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly eventBus: EventBus,
    private readonly activityService: ActivityService,
  ) {}

  async execute(command: CreateTaskCommand) {
    const { userId, dto } = command;

    const project = await this.taskRepository.findProject(dto.projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isAdmin = await this.taskRepository.isWorkspaceAdmin(project.workspaceId, userId);
    if (!isAdmin && project.teamLead !== userId) {
      throw new ForbiddenException('Only workspace admin or team lead can create tasks');
    }

    if (dto.assigneeId) {
      if (dto.assigneeId !== project.teamLead) {
        const member = await this.taskRepository.findWorkspaceMember(project.workspaceId, dto.assigneeId);
        if (!member) {
          throw new BadRequestException('Assignee must be a workspace member');
        }
      }
    }

    const task = await this.taskRepository.create({
      projectId: dto.projectId,
      title: dto.title,
      description: dto.description,
      status: dto.status,
      type: dto.type,
      priority: dto.priority,
      assigneeId: dto.assigneeId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    });

    const taskWithRelations = await this.taskRepository.findById(task.id);

    if (taskWithRelations) {
      this.eventBus.publish(new TaskCreatedEvent(taskWithRelations, project, dto));

      await this.activityService.logActivity(
        userId,
        dto.projectId,
        ActivityType.TASK_CREATED,
        {
          taskId: task.id,
          description: `created task "${task.title}"`,
          metadata: { taskTitle: task.title },
        },
      );
    }

    return { task: taskWithRelations, message: 'Task created successfully' };
  }
}
