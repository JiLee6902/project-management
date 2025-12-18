import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { KafkaProducerService, NotificationEventDto } from '@app/external-infra';
import { TaskRepository } from '../repository/task.repository';
import { CreateTaskDto, UpdateTaskDto, DeleteTasksDto } from '../dto';

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async createTask(userId: string, dto: CreateTaskDto) {
    const project = await this.taskRepository.findProject(dto.projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Only team lead can create tasks
    if (project.teamLead !== userId) {
      throw new ForbiddenException('Only team lead can create tasks');
    }

    // Validate assignee is project member
    if (dto.assigneeId) {
      const member = await this.taskRepository.findProjectMember(dto.projectId, dto.assigneeId);
      if (!member) {
        throw new BadRequestException('Assignee must be a project member');
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
      dueDate: dto.dueDate,
    });

    // Send notification if task is assigned (via Kafka only - notification service will send email)
    if (dto.assigneeId) {
      const assignee = await this.taskRepository.findUser(dto.assigneeId);
      if (assignee) {
        try {
          await this.kafkaProducer.sendNotification(
            NotificationEventDto.taskAssigned({
              userId: assignee.id,
              userEmail: assignee.email,
              userName: assignee.name || assignee.email,
              taskId: task.id,
              taskTitle: task.title,
              taskDescription: task.description,
              projectName: project.name,
              dueDate: task.dueDate,
              origin: dto.origin,
            }),
          );
        } catch (error) {
          console.error('Failed to send Kafka notification:', error);
        }
      }
    }

    const taskWithRelations = await this.taskRepository.findById(task.id);
    return { task: taskWithRelations, message: 'Task created successfully' };
  }

  async updateTask(userId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const project = await this.taskRepository.findProject(task.projectId);
    if (!project || project.teamLead !== userId) {
      throw new ForbiddenException('Only team lead can update tasks');
    }

    await this.taskRepository.update(taskId, dto);
    const updatedTask = await this.taskRepository.findById(taskId);
    return { task: updatedTask, message: 'Task updated successfully' };
  }

  async deleteTasks(userId: string, dto: DeleteTasksDto) {
    if (!dto.taskIds?.length) {
      throw new BadRequestException('Task IDs are required');
    }

    // Fetch all tasks to verify they exist and belong to same project
    const tasks = await this.taskRepository.findByIds(dto.taskIds);
    if (tasks.length !== dto.taskIds.length) {
      throw new NotFoundException('One or more tasks not found');
    }

    // Verify all tasks belong to the same project
    const projectId = tasks[0].projectId;
    const allSameProject = tasks.every(task => task.projectId === projectId);
    if (!allSameProject) {
      throw new BadRequestException('All tasks must belong to the same project');
    }

    // Verify user is team lead
    const project = await this.taskRepository.findProject(projectId);
    if (!project || project.teamLead !== userId) {
      throw new ForbiddenException('Only team lead can delete tasks');
    }

    await this.taskRepository.deleteMany(dto.taskIds);
    return { message: 'Tasks deleted successfully' };
  }
}
