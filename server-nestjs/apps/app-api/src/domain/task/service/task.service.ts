import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { KafkaProducerService, NotificationEventDto, WebSocketService } from '@app/external-infra';
import { TaskRepository } from '../repository/task.repository';
import { CreateTaskDto, UpdateTaskDto, DeleteTasksDto } from '../dto';
import { Task, TaskTemplate, TaskStatus, WorkspaceMember, TaskDependency, TaskWatcher, DependencyType } from '@app/entity/entities';

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly webSocketService: WebSocketService,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(TaskTemplate)
    private readonly templateRepo: Repository<TaskTemplate>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepo: Repository<WorkspaceMember>,
    @InjectRepository(TaskDependency)
    private readonly dependencyRepo: Repository<TaskDependency>,
    @InjectRepository(TaskWatcher)
    private readonly watcherRepo: Repository<TaskWatcher>,
  ) {}

  async createTask(userId: string, dto: CreateTaskDto) {
    const project = await this.taskRepository.findProject(dto.projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Only workspace admin or team lead can create tasks
    const isAdmin = await this.taskRepository.isWorkspaceAdmin(project.workspaceId, userId);
    if (!isAdmin && project.teamLead !== userId) {
      throw new ForbiddenException('Only workspace admin or team lead can create tasks');
    }

    // Validate assignee is workspace member or team lead
    if (dto.assigneeId) {
      // Team lead can always be assigned
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

    this.webSocketService.emitTaskCreated({
      task: taskWithRelations,
      projectId: project.id,
      workspaceId: project.workspaceId,
    });

    return { task: taskWithRelations, message: 'Task created successfully' };
  }

  async updateTask(userId: string, taskId: string, dto: UpdateTaskDto) {
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

    // Non-admin/non-teamlead can only update status
    if (!isAdmin && !isTeamLead) {
      const allowedFields = ['status'];
      // Filter out undefined/null/empty string fields and check for actual values
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

    await this.taskRepository.update(taskId, dto);
    const updatedTask = await this.taskRepository.findById(taskId);

    this.webSocketService.emitTaskUpdated({
      task: updatedTask,
      projectId: project.id,
      workspaceId: project.workspaceId,
    });

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

    // Verify user is workspace admin or team lead
    const project = await this.taskRepository.findProject(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isAdmin = await this.taskRepository.isWorkspaceAdmin(project.workspaceId, userId);
    if (!isAdmin && project.teamLead !== userId) {
      throw new ForbiddenException('Only workspace admin or team lead can delete tasks');
    }

    await this.taskRepository.deleteMany(dto.taskIds);

    this.webSocketService.emitTaskDeleted({
      taskIds: dto.taskIds,
      projectId,
      workspaceId: project.workspaceId,
    });

    return { message: 'Tasks deleted successfully' };
  }

  // Get all tasks assigned to user
  async getMyTasks(userId: string) {
    const tasks = await this.taskRepo.find({
      where: { assigneeId: userId },
      relations: ['project', 'labels', 'subtasks', 'sprint'],
      order: { dueDate: 'ASC', createdAt: 'DESC' },
    });

    // Group by status
    const grouped = {
      todo: tasks.filter(t => t.status === TaskStatus.TODO),
      inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS),
      done: tasks.filter(t => t.status === TaskStatus.DONE),
    };

    return { tasks, grouped };
  }

  // Get workload for all workspace members
  async getWorkload(workspaceId: string) {
    const members = await this.workspaceMemberRepo.find({
      where: { workspaceId },
      relations: ['user'],
    });

    const workload = await Promise.all(
      members.map(async (member) => {
        const tasks = await this.taskRepo.find({
          where: {
            assigneeId: member.userId,
            status: In([TaskStatus.TODO, TaskStatus.IN_PROGRESS]),
          },
          relations: ['project'],
        });

        const totalStoryPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;

        return {
          user: {
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
          },
          taskCount: tasks.length,
          totalStoryPoints,
          overdueTasks,
          tasks: tasks.slice(0, 5), // Return first 5 tasks as preview
        };
      })
    );

    return { workload };
  }

  // Duplicate a task
  async duplicateTask(userId: string, taskId: string) {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const project = await this.taskRepository.findProject(task.projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Create duplicated task
    const duplicatedTask = await this.taskRepository.create({
      projectId: task.projectId,
      title: `${task.title} (Copy)`,
      description: task.description,
      status: TaskStatus.TODO,
      type: task.type,
      priority: task.priority,
      estimatedTime: task.estimatedTime,
      storyPoints: task.storyPoints,
      sprintId: task.sprintId,
    });

    // Duplicate subtasks
    if (task.subtasks?.length) {
      for (const subtask of task.subtasks) {
        await this.taskRepository.createSubtask({
          taskId: duplicatedTask.id,
          title: subtask.title,
          completed: false,
        });
      }
    }

    // Copy labels
    if (task.labels?.length) {
      await this.taskRepository.setLabels(duplicatedTask.id, task.labels.map(l => l.id));
    }

    const taskWithRelations = await this.taskRepository.findById(duplicatedTask.id);

    this.webSocketService.emitTaskCreated({
      task: taskWithRelations,
      projectId: project.id,
      workspaceId: project.workspaceId,
    });

    return { task: taskWithRelations, message: 'Task duplicated successfully' };
  }

  // Create task from template
  async createFromTemplate(
    userId: string,
    templateId: string,
    dto: { projectId: string; assigneeId?: string; dueDate?: string },
  ) {
    const template = await this.templateRepo.findOne({ where: { id: templateId } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const project = await this.taskRepository.findProject(dto.projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Create task from template
    const task = await this.taskRepository.create({
      projectId: dto.projectId,
      title: template.name,
      description: template.description,
      status: TaskStatus.TODO,
      type: template.type,
      priority: template.priority,
      estimatedTime: template.estimatedTime,
      storyPoints: template.storyPoints,
      assigneeId: dto.assigneeId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    });

    // Create subtasks from template
    if (template.subtasks?.length) {
      for (const subtask of template.subtasks) {
        await this.taskRepository.createSubtask({
          taskId: task.id,
          title: subtask.title,
          completed: false,
        });
      }
    }

    const taskWithRelations = await this.taskRepository.findById(task.id);

    this.webSocketService.emitTaskCreated({
      task: taskWithRelations,
      projectId: project.id,
      workspaceId: project.workspaceId,
    });

    return { task: taskWithRelations, message: 'Task created from template successfully' };
  }

  // Export tasks as JSON/CSV format
  async exportTasks(projectId: string) {
    const tasks = await this.taskRepo.find({
      where: { projectId },
      relations: ['assignee', 'labels', 'subtasks'],
      order: { createdAt: 'DESC' },
    });

    const exportData = tasks.map(task => ({
      title: task.title,
      description: task.description,
      status: task.status,
      type: task.type,
      priority: task.priority,
      assignee: task.assignee?.email || '',
      dueDate: task.dueDate?.toISOString() || '',
      estimatedTime: task.estimatedTime,
      storyPoints: task.storyPoints || '',
      labels: task.labels?.map(l => l.name).join(', ') || '',
      subtasks: task.subtasks?.map(s => s.title).join('; ') || '',
      createdAt: task.createdAt?.toISOString() || '',
    }));

    return { tasks: exportData };
  }

  // Import tasks from JSON
  async importTasks(userId: string, projectId: string, tasksData: any[]) {
    const project = await this.taskRepository.findProject(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isAdmin = await this.taskRepository.isWorkspaceAdmin(project.workspaceId, userId);
    if (!isAdmin && project.teamLead !== userId) {
      throw new ForbiddenException('Only workspace admin or team lead can import tasks');
    }

    const createdTasks: any[] = [];

    for (const taskData of tasksData) {
      const task = await this.taskRepository.create({
        projectId,
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status || TaskStatus.TODO,
        type: taskData.type || 'TASK',
        priority: taskData.priority || 'MEDIUM',
        estimatedTime: taskData.estimatedTime || 0,
        storyPoints: taskData.storyPoints || null,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      });

      // Create subtasks if provided
      if (taskData.subtasks) {
        const subtaskTitles = taskData.subtasks.split(';').map((s: string) => s.trim()).filter(Boolean);
        for (const title of subtaskTitles) {
          await this.taskRepository.createSubtask({
            taskId: task.id,
            title,
            completed: false,
          });
        }
      }

      createdTasks.push(task);
    }

    return {
      tasks: createdTasks,
      message: `${createdTasks.length} tasks imported successfully`
    };
  }

  // ========== TASK DEPENDENCIES ==========

  async getTaskDependencies(taskId: string) {
    const dependencies = await this.dependencyRepo.find({
      where: [
        { taskId },
        { dependsOnTaskId: taskId }
      ],
      relations: ['task', 'dependsOnTask', 'creator'],
    });

    return { dependencies };
  }

  async addDependency(userId: string, taskId: string, dependsOnTaskId: string, type: string) {
    if (taskId === dependsOnTaskId) {
      throw new BadRequestException('A task cannot depend on itself');
    }

    // Check if both tasks exist
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    const dependsOnTask = await this.taskRepo.findOne({ where: { id: dependsOnTaskId } });

    if (!task || !dependsOnTask) {
      throw new NotFoundException('One or both tasks not found');
    }

    // Check for existing dependency
    const existing = await this.dependencyRepo.findOne({
      where: { taskId, dependsOnTaskId }
    });

    if (existing) {
      throw new BadRequestException('Dependency already exists');
    }

    // Check for circular dependency
    const reverseExists = await this.dependencyRepo.findOne({
      where: { taskId: dependsOnTaskId, dependsOnTaskId: taskId }
    });

    if (reverseExists) {
      throw new BadRequestException('Circular dependency detected');
    }

    const dependency = this.dependencyRepo.create({
      taskId,
      dependsOnTaskId,
      type: type as DependencyType || DependencyType.BLOCKED_BY,
      createdBy: userId,
    });

    await this.dependencyRepo.save(dependency);

    const saved = await this.dependencyRepo.findOne({
      where: { id: dependency.id },
      relations: ['task', 'dependsOnTask', 'creator'],
    });

    return { dependency: saved, message: 'Dependency added successfully' };
  }

  async removeDependency(dependencyId: string) {
    const dependency = await this.dependencyRepo.findOne({ where: { id: dependencyId } });
    if (!dependency) {
      throw new NotFoundException('Dependency not found');
    }

    await this.dependencyRepo.delete(dependencyId);
    return { message: 'Dependency removed successfully' };
  }

  // ========== TASK WATCHERS ==========

  async getTaskWatchers(taskId: string) {
    const watchers = await this.watcherRepo.find({
      where: { taskId },
      relations: ['user'],
    });

    return { watchers };
  }

  async addWatcher(taskId: string, userId: string) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const existing = await this.watcherRepo.findOne({
      where: { taskId, userId }
    });

    if (existing) {
      return { watcher: existing, message: 'Already watching this task' };
    }

    const watcher = this.watcherRepo.create({ taskId, userId });
    await this.watcherRepo.save(watcher);

    const saved = await this.watcherRepo.findOne({
      where: { id: watcher.id },
      relations: ['user'],
    });

    return { watcher: saved, message: 'Now watching this task' };
  }

  async removeWatcher(taskId: string, userId: string) {
    const watcher = await this.watcherRepo.findOne({
      where: { taskId, userId }
    });

    if (!watcher) {
      throw new NotFoundException('Not watching this task');
    }

    await this.watcherRepo.delete(watcher.id);
    return { message: 'Stopped watching this task' };
  }

  async bulkUpdateTasks(userId: string, taskIds: string[], updates: any) {
    if (!taskIds || taskIds.length === 0) {
      throw new BadRequestException('No tasks specified');
    }

    const tasks = await this.taskRepo.find({
      where: { id: In(taskIds) },
      relations: ['project'],
    });

    if (tasks.length === 0) {
      throw new NotFoundException('No tasks found');
    }

    const updateData: any = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.assigneeId) updateData.assigneeId = updates.assigneeId;
    if (updates.sprintId) updateData.sprintId = updates.sprintId;

    await this.taskRepo.update({ id: In(taskIds) }, updateData);

    const updatedTasks = await this.taskRepo.find({
      where: { id: In(taskIds) },
      relations: ['assignee', 'labels'],
    });

    return {
      tasks: updatedTasks,
      message: `${updatedTasks.length} tasks updated successfully`
    };
  }

  async bulkMoveTasks(userId: string, taskIds: string[], targetProjectId: string) {
    if (!taskIds || taskIds.length === 0) {
      throw new BadRequestException('No tasks specified');
    }

    const targetProject = await this.taskRepository.findProject(targetProjectId);
    if (!targetProject) {
      throw new NotFoundException('Target project not found');
    }

    await this.taskRepo.update(
      { id: In(taskIds) },
      { projectId: targetProjectId }
    );

    const movedTasks = await this.taskRepo.find({
      where: { id: In(taskIds) },
      relations: ['assignee', 'labels'],
    });

    return {
      tasks: movedTasks,
      message: `${movedTasks.length} tasks moved successfully`
    };
  }
}
