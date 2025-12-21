import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectTemplate, Project, Task, Subtask, TaskType, TaskPriority, TaskStatus } from '@app/entity/entities';

@Injectable()
export class ProjectTemplateService {
  constructor(
    @InjectRepository(ProjectTemplate)
    private readonly templateRepo: Repository<ProjectTemplate>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Subtask)
    private readonly subtaskRepo: Repository<Subtask>,
  ) {}

  async getWorkspaceTemplates(workspaceId: string) {
    const templates = await this.templateRepo.find({
      where: { workspaceId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
    return { templates };
  }

  async getTemplate(id: string) {
    const template = await this.templateRepo.findOne({
      where: { id },
      relations: ['creator'],
    });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return { template };
  }

  async createTemplate(userId: string, data: {
    name: string;
    description?: string;
    workspaceId: string;
    template: any;
    isPublic?: boolean;
  }) {
    const template = this.templateRepo.create({
      ...data,
      createdBy: userId,
    });

    await this.templateRepo.save(template);
    return { template, message: 'Template created successfully' };
  }

  async createTemplateFromProject(userId: string, projectId: string, data: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['tasks', 'tasks.subtasks'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const templateTasks = project.tasks?.map(task => ({
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      subtasks: task.subtasks?.map(s => ({ title: s.title })),
    })) || [];

    const template = this.templateRepo.create({
      name: data.name,
      description: data.description,
      workspaceId: project.workspaceId,
      template: { tasks: templateTasks },
      isPublic: data.isPublic || false,
      createdBy: userId,
    });

    await this.templateRepo.save(template);
    return { template, message: 'Template created from project successfully' };
  }

  async applyTemplateToProject(userId: string, templateId: string, projectId: string) {
    const template = await this.templateRepo.findOne({ where: { id: templateId } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const createdTasks: Task[] = [];
    const projectStartDate = project.startDate || new Date();

    for (const taskData of template.template.tasks || []) {
      const dueDate = taskData.dueOffsetDays
        ? new Date(projectStartDate.getTime() + taskData.dueOffsetDays * 24 * 60 * 60 * 1000)
        : undefined;

      const taskEntity = new Task();
      taskEntity.projectId = projectId;
      taskEntity.title = taskData.title;
      taskEntity.description = taskData.description || '';
      taskEntity.type = (taskData.type as TaskType) || TaskType.TASK;
      taskEntity.priority = (taskData.priority as TaskPriority) || TaskPriority.MEDIUM;
      taskEntity.status = TaskStatus.TODO;
      if (dueDate) taskEntity.dueDate = dueDate;

      const task = await this.taskRepo.save(taskEntity);

      // Create subtasks
      if (taskData.subtasks) {
        for (const subtaskData of taskData.subtasks) {
          const subtask = this.subtaskRepo.create({
            taskId: task.id,
            title: subtaskData.title,
            completed: false,
          });
          await this.subtaskRepo.save(subtask);
        }
      }

      createdTasks.push(task);
    }

    return {
      tasks: createdTasks,
      message: `${createdTasks.length} tasks created from template`
    };
  }

  async updateTemplate(id: string, data: Partial<{
    name: string;
    description: string;
    template: any;
    isPublic: boolean;
  }>) {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    Object.assign(template, data);
    await this.templateRepo.save(template);
    return { template, message: 'Template updated successfully' };
  }

  async deleteTemplate(id: string) {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    await this.templateRepo.delete(id);
    return { message: 'Template deleted successfully' };
  }
}
