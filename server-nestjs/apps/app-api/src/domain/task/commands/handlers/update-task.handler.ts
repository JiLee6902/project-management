import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateTaskCommand } from '../update-task.command';
import { TaskRepository } from '../../repository/task.repository';
import { TaskUpdatedEvent } from '../../events/task-updated.event';
import { ActivityService } from '../../../activity/service/activity.service';
import { ActivityType } from '@app/entity/entities';

@CommandHandler(UpdateTaskCommand)
export class UpdateTaskHandler implements ICommandHandler<UpdateTaskCommand> {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly eventBus: EventBus,
    private readonly activityService: ActivityService,
  ) {}

  async execute(command: UpdateTaskCommand) {
    const { userId, taskId, dto } = command;

    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const project = await this.taskRepository.findProject(task.projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isAdmin = await this.taskRepository.isWorkspaceAdmin(project.workspaceId, userId);
    const isTeamLead = project.teamLead === userId;
    const isAssignee = task.assigneeId === userId;
    const isWorkspaceMember = await this.taskRepository.findWorkspaceMember(project.workspaceId, userId);
    const isProjectMember = await this.taskRepository.findProjectMember(task.projectId, userId);

    if (!isAdmin && !isTeamLead && !isAssignee && !isWorkspaceMember && !isProjectMember) {
      throw new ForbiddenException('You do not have permission to update this task');
    }

    if (!isAdmin && !isTeamLead) {
      const allowedFields = ['status'];
      const updateFields = Object.entries(dto)
        .filter(([_, value]) => {
          if (value === undefined || value === null || value === '') return false;
          return true;
        })
        .map(([key]) => key);

      console.log('DEBUG: DTO fields:', updateFields, 'DTO:', JSON.stringify(dto));

      const hasDisallowedFields = updateFields.some(field => !allowedFields.includes(field));
      if (hasDisallowedFields) {
        throw new ForbiddenException(`Members can only update task status. Received fields: ${updateFields.join(', ')}`);
      }
    }

    const originalTask = { ...task };

    await this.taskRepository.update(taskId, dto);
    const updatedTask = await this.taskRepository.findById(taskId);

    if (updatedTask) {
      this.eventBus.publish(new TaskUpdatedEvent(updatedTask, project));

      if (dto.status && dto.status !== originalTask.status) {
        await this.activityService.logActivity(
          userId,
          task.projectId,
          ActivityType.TASK_STATUS_CHANGED,
          {
            taskId,
            description: `changed status from "${originalTask.status}" to "${dto.status}"`,
            metadata: { from: originalTask.status, to: dto.status, taskTitle: task.title },
          },
        );
      }

      if (dto.priority && dto.priority !== originalTask.priority) {
        await this.activityService.logActivity(
          userId,
          task.projectId,
          ActivityType.TASK_PRIORITY_CHANGED,
          {
            taskId,
            description: `changed priority from "${originalTask.priority}" to "${dto.priority}"`,
            metadata: { from: originalTask.priority, to: dto.priority, taskTitle: task.title },
          },
        );
      }

      if (dto.assigneeId !== undefined && dto.assigneeId !== originalTask.assigneeId) {
        await this.activityService.logActivity(
          userId,
          task.projectId,
          ActivityType.TASK_ASSIGNEE_CHANGED,
          {
            taskId,
            description: `changed assignee`,
            metadata: { from: originalTask.assigneeId, to: dto.assigneeId, taskTitle: task.title },
          },
        );
      }

      if (dto.dueDate !== undefined) {
        const newDueDate = dto.dueDate ? new Date(dto.dueDate).toISOString() : null;
        const origDueDate = originalTask.dueDate ? new Date(originalTask.dueDate).toISOString() : null;
        if (newDueDate !== origDueDate) {
          await this.activityService.logActivity(
            userId,
            task.projectId,
            ActivityType.TASK_DUE_DATE_CHANGED,
            {
              taskId,
              description: `changed due date`,
              metadata: { from: origDueDate, to: newDueDate, taskTitle: task.title },
            },
          );
        }
      }

      const specificFields = ['status', 'priority', 'assigneeId', 'dueDate'];
      const otherFieldsChanged = Object.keys(dto).some(key => !specificFields.includes(key));
      if (otherFieldsChanged && !dto.status && !dto.priority && dto.assigneeId === undefined && dto.dueDate === undefined) {
        await this.activityService.logActivity(
          userId,
          task.projectId,
          ActivityType.TASK_UPDATED,
          {
            taskId,
            description: `updated task "${task.title}"`,
            metadata: { taskTitle: task.title, fields: Object.keys(dto) },
          },
        );
      }
    }

    return { task: updatedTask, message: 'Task updated successfully' };
  }
}
