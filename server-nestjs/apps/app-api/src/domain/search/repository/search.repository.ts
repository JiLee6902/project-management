import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task, Project, WorkspaceMember, Comment, User } from '@app/entity/entities';

export interface SearchResult {
  type: 'task' | 'project' | 'comment' | 'user';
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  rank?: number;
}

@Injectable()
export class SearchRepository {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUserWorkspaceIds(userId: string): Promise<string[]> {
    const memberships = await this.workspaceMemberRepository.find({
      where: { userId },
      select: ['workspaceId'],
    });
    return memberships.map((m) => m.workspaceId);
  }

  private buildTsQuery(query: string): string {
    // Handle special characters and build query
    const words = query
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 0);

    if (words.length === 0) return '';

    // Use prefix matching for partial word search
    return words.map((w) => `${w}:*`).join(' & ');
  }

  async searchTasks(query: string, workspaceIds: string[], limit = 10): Promise<Task[]> {
    const projects = await this.projectRepository.find({
      where: { workspaceId: In(workspaceIds) },
      select: ['id'],
    });
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) return [];

    const tsQuery = this.buildTsQuery(query);
    if (!tsQuery) return [];

    return this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .addSelect(
        `ts_rank(to_tsvector('english', coalesce(task.title, '') || ' ' || coalesce(task.description, '')), to_tsquery('english', :tsQuery))`,
        'rank',
      )
      .where('task.projectId IN (:...projectIds)', { projectIds })
      .andWhere(
        `(to_tsvector('english', coalesce(task.title, '') || ' ' || coalesce(task.description, '')) @@ to_tsquery('english', :tsQuery))`,
        { tsQuery },
      )
      .orderBy('rank', 'DESC')
      .addOrderBy('task.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async searchProjects(query: string, workspaceIds: string[], limit = 10): Promise<Project[]> {
    const tsQuery = this.buildTsQuery(query);
    if (!tsQuery) return [];

    return this.projectRepository
      .createQueryBuilder('project')
      .addSelect(
        `ts_rank(to_tsvector('english', coalesce(project.name, '') || ' ' || coalesce(project.description, '')), to_tsquery('english', :tsQuery))`,
        'rank',
      )
      .where('project.workspaceId IN (:...workspaceIds)', { workspaceIds })
      .andWhere(
        `(to_tsvector('english', coalesce(project.name, '') || ' ' || coalesce(project.description, '')) @@ to_tsquery('english', :tsQuery))`,
        { tsQuery },
      )
      .orderBy('rank', 'DESC')
      .addOrderBy('project.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async searchComments(query: string, projectIds: string[], limit = 10): Promise<Comment[]> {
    if (projectIds.length === 0) return [];

    const tsQuery = this.buildTsQuery(query);
    if (!tsQuery) return [];

    return this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.task', 'task')
      .leftJoinAndSelect('comment.user', 'user')
      .where('task.projectId IN (:...projectIds)', { projectIds })
      .andWhere(
        `to_tsvector('english', coalesce(comment.content, '')) @@ to_tsquery('english', :tsQuery)`,
        { tsQuery },
      )
      .orderBy('comment.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async searchUsers(query: string, workspaceIds: string[], limit = 10): Promise<User[]> {
    const memberUserIds = await this.workspaceMemberRepository
      .createQueryBuilder('wm')
      .select('DISTINCT wm.userId', 'userId')
      .where('wm.workspaceId IN (:...workspaceIds)', { workspaceIds })
      .getRawMany();

    const userIds = memberUserIds.map((m) => m.userId);
    if (userIds.length === 0) return [];

    const tsQuery = this.buildTsQuery(query);
    if (!tsQuery) return [];

    return this.userRepository
      .createQueryBuilder('user')
      .where('user.id IN (:...userIds)', { userIds })
      .andWhere(
        `to_tsvector('english', coalesce(user.name, '') || ' ' || coalesce(user.email, '')) @@ to_tsquery('english', :tsQuery)`,
        { tsQuery },
      )
      .take(limit)
      .getMany();
  }

  // Fuzzy search using ILIKE (fallback when full-text returns no results)
  async fuzzySearchTasks(query: string, projectIds: string[], limit = 10): Promise<Task[]> {
    if (projectIds.length === 0) return [];

    const pattern = `%${query}%`;

    return this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.projectId IN (:...projectIds)', { projectIds })
      .andWhere('(task.title ILIKE :pattern OR task.description ILIKE :pattern)', { pattern })
      .orderBy('task.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  // Get search suggestions (recent + popular)
  async getSearchSuggestions(projectIds: string[], limit = 5): Promise<string[]> {
    if (projectIds.length === 0) return [];

    const recentTasks = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.title', 'title')
      .where('task.projectId IN (:...projectIds)', { projectIds })
      .orderBy('task.createdAt', 'DESC')
      .take(limit)
      .getRawMany();

    return recentTasks.map((t) => t.title);
  }

  // Global search across all entities with unified results
  async globalSearch(
    query: string,
    workspaceIds: string[],
    options?: { includeComments?: boolean; includeUsers?: boolean; limit?: number },
  ): Promise<SearchResult[]> {
    const limit = options?.limit || 20;
    const results: SearchResult[] = [];

    // Get project IDs for workspaces
    const projects = await this.projectRepository.find({
      where: { workspaceId: In(workspaceIds) },
      select: ['id', 'name'],
    });
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));
    const projectIds = projects.map((p) => p.id);

    // Search tasks
    const tasks = await this.searchTasks(query, workspaceIds, Math.ceil(limit / 2));
    for (const task of tasks) {
      results.push({
        type: 'task',
        id: task.id,
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        projectName: projectMap.get(task.projectId),
      });
    }

    // Search projects
    const projectResults = await this.searchProjects(query, workspaceIds, Math.ceil(limit / 4));
    for (const project of projectResults) {
      results.push({
        type: 'project',
        id: project.id,
        title: project.name,
        description: project.description,
      });
    }

    // Search comments (optional)
    if (options?.includeComments && projectIds.length > 0) {
      const comments = await this.searchComments(query, projectIds, Math.ceil(limit / 4));
      for (const comment of comments) {
        results.push({
          type: 'comment',
          id: comment.id,
          title: comment.content?.substring(0, 100) || '',
          projectId: comment.task?.projectId,
          projectName: comment.task?.projectId ? projectMap.get(comment.task.projectId) : undefined,
        });
      }
    }

    // Search users (optional)
    if (options?.includeUsers) {
      const users = await this.searchUsers(query, workspaceIds, 5);
      for (const user of users) {
        results.push({
          type: 'user',
          id: user.id,
          title: user.name || user.email,
          description: user.email,
        });
      }
    }

    return results.slice(0, limit);
  }
}
