import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, Task, User, Workspace } from '@app/entity/entities';
import { BloomFilterService } from '@app/external-infra';

export const BLOOM_FILTERS = {
  PROJECTS: 'projects',
  TASKS: 'tasks',
  USERS: 'users',
  WORKSPACES: 'workspaces',
};

@Injectable()
export class BloomFilterRebuildService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    private readonly bloomFilter: BloomFilterService,
  ) {}

  async rebuildAllFilters(): Promise<{
    projects: number;
    tasks: number;
    users: number;
    workspaces: number;
  }> {
    const [projects, tasks, users, workspaces] = await Promise.all([
      this.rebuildProjectsFilter(),
      this.rebuildTasksFilter(),
      this.rebuildUsersFilter(),
      this.rebuildWorkspacesFilter(),
    ]);

    return { projects, tasks, users, workspaces };
  }

  async rebuildProjectsFilter(): Promise<number> {
    await this.bloomFilter.clear(BLOOM_FILTERS.PROJECTS);

    const projects = await this.projectRepository.find({ select: ['id'] });
    if (projects.length > 0) {
      const ids = projects.map((p) => p.id);
      await this.bloomFilter.addMany(BLOOM_FILTERS.PROJECTS, ids);
    }

    return projects.length;
  }

  async rebuildTasksFilter(): Promise<number> {
    await this.bloomFilter.clear(BLOOM_FILTERS.TASKS);

    const tasks = await this.taskRepository.find({ select: ['id'] });
    if (tasks.length > 0) {
      const ids = tasks.map((t) => t.id);
      await this.bloomFilter.addMany(BLOOM_FILTERS.TASKS, ids);
    }

    return tasks.length;
  }

  async rebuildUsersFilter(): Promise<number> {
    await this.bloomFilter.clear(BLOOM_FILTERS.USERS);

    const users = await this.userRepository.find({ select: ['id'] });
    if (users.length > 0) {
      const ids = users.map((u) => u.id);
      await this.bloomFilter.addMany(BLOOM_FILTERS.USERS, ids);
    }

    return users.length;
  }

  async rebuildWorkspacesFilter(): Promise<number> {
    await this.bloomFilter.clear(BLOOM_FILTERS.WORKSPACES);

    const workspaces = await this.workspaceRepository.find({ select: ['id'] });
    if (workspaces.length > 0) {
      const ids = workspaces.map((w) => w.id);
      await this.bloomFilter.addMany(BLOOM_FILTERS.WORKSPACES, ids);
    }

    return workspaces.length;
  }

  async getFilterStats(): Promise<Record<string, any>> {
    const [projects, tasks, users, workspaces] = await Promise.all([
      this.bloomFilter.getStats(BLOOM_FILTERS.PROJECTS),
      this.bloomFilter.getStats(BLOOM_FILTERS.TASKS),
      this.bloomFilter.getStats(BLOOM_FILTERS.USERS),
      this.bloomFilter.getStats(BLOOM_FILTERS.WORKSPACES),
    ]);

    return { projects, tasks, users, workspaces };
  }
}
