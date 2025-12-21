import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task, Project, WorkspaceMember } from '@app/entity/entities';

@Injectable()
export class SearchRepository {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
  ) {}

  async getUserWorkspaceIds(userId: string): Promise<string[]> {
    const memberships = await this.workspaceMemberRepository.find({
      where: { userId },
      select: ['workspaceId'],
    });
    return memberships.map((m) => m.workspaceId);
  }

  async searchTasks(query: string, workspaceIds: string[], limit = 10): Promise<Task[]> {
    const projects = await this.projectRepository.find({
      where: { workspaceId: In(workspaceIds) },
      select: ['id'],
    });
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) return [];

    const tsQuery = query.split(/\s+/).filter(Boolean).map(w => `${w}:*`).join(' & ');

    return this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.projectId IN (:...projectIds)', { projectIds })
      .andWhere(
        `(to_tsvector('english', coalesce(task.title, '') || ' ' || coalesce(task.description, '')) @@ to_tsquery('english', :tsQuery))`,
        { tsQuery },
      )
      .orderBy('task.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async searchProjects(query: string, workspaceIds: string[], limit = 10): Promise<Project[]> {
    const tsQuery = query.split(/\s+/).filter(Boolean).map(w => `${w}:*`).join(' & ');

    return this.projectRepository
      .createQueryBuilder('project')
      .where('project.workspaceId IN (:...workspaceIds)', { workspaceIds })
      .andWhere(
        `(to_tsvector('english', coalesce(project.name, '') || ' ' || coalesce(project.description, '')) @@ to_tsquery('english', :tsQuery))`,
        { tsQuery },
      )
      .orderBy('project.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }
}
