import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, Task } from '@app/entity/entities';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async exportProjectTasks(projectId: string, format: 'csv' | 'json' = 'csv'): Promise<any> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const tasks = await this.taskRepository.find({
      where: { projectId },
      relations: ['assignee', 'labels'],
      order: { createdAt: 'DESC' },
    });

    if (format === 'json') {
      return {
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
        },
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          type: task.type,
          assignee: task.assignee?.name || 'Unassigned',
          dueDate: task.dueDate,
          estimatedTime: task.estimatedTime,
          loggedTime: task.loggedTime,
          labels: task.labels?.map(l => l.name).join(', ') || '',
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        })),
        exportedAt: new Date().toISOString(),
      };
    }

    const headers = [
      'ID',
      'Title',
      'Description',
      'Status',
      'Priority',
      'Type',
      'Assignee',
      'Due Date',
      'Estimated Time (min)',
      'Logged Time (min)',
      'Labels',
      'Created At',
    ];

    const rows = tasks.map(task => [
      task.id,
      this.escapeCsvField(task.title),
      this.escapeCsvField(task.description || ''),
      task.status,
      task.priority,
      task.type,
      task.assignee?.name || 'Unassigned',
      task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      task.estimatedTime || 0,
      task.loggedTime || 0,
      task.labels?.map(l => l.name).join('; ') || '',
      task.createdAt ? new Date(task.createdAt).toISOString() : '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return {
      content: csv,
      filename: `${project.name.replace(/[^a-z0-9]/gi, '_')}_tasks_${new Date().toISOString().split('T')[0]}.csv`,
      contentType: 'text/csv',
    };
  }

  async exportProjectSummary(projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const tasks = await this.taskRepository.find({
      where: { projectId },
      relations: ['assignee'],
    });

    const summary = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
      },
      statistics: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'DONE').length,
        inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        todoTasks: tasks.filter(t => t.status === 'TODO').length,
        highPriorityTasks: tasks.filter(t => t.priority === 'HIGH').length,
        overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE').length,
        totalEstimatedTime: tasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0),
        totalLoggedTime: tasks.reduce((sum, t) => sum + (t.loggedTime || 0), 0),
      },
      tasksByAssignee: this.groupTasksByAssignee(tasks),
      tasksByStatus: {
        TODO: tasks.filter(t => t.status === 'TODO').length,
        IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        DONE: tasks.filter(t => t.status === 'DONE').length,
      },
      exportedAt: new Date().toISOString(),
    };

    return summary;
  }

  private escapeCsvField(field: string): string {
    if (!field) return '';
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  private groupTasksByAssignee(tasks: Task[]) {
    const grouped: Record<string, number> = {};
    tasks.forEach(task => {
      const assigneeName = task.assignee?.name || 'Unassigned';
      grouped[assigneeName] = (grouped[assigneeName] || 0) + 1;
    });
    return grouped;
  }
}
