import { Injectable } from '@nestjs/common';
import { SearchRepository } from '../repository/search.repository';

@Injectable()
export class SearchService {
  constructor(private readonly searchRepository: SearchRepository) {}

  async search(userId: string, query: string) {
    if (!query || query.trim().length < 2) {
      return { tasks: [], projects: [] };
    }

    const workspaceIds = await this.searchRepository.getUserWorkspaceIds(userId);
    if (workspaceIds.length === 0) {
      return { tasks: [], projects: [] };
    }

    const [tasks, projects] = await Promise.all([
      this.searchRepository.searchTasks(query.trim(), workspaceIds),
      this.searchRepository.searchProjects(query.trim(), workspaceIds),
    ]);

    return { tasks, projects };
  }

  async searchTasks(userId: string, query: string, limit = 10) {
    if (!query || query.trim().length < 2) {
      return { tasks: [] };
    }

    const workspaceIds = await this.searchRepository.getUserWorkspaceIds(userId);
    if (workspaceIds.length === 0) {
      return { tasks: [] };
    }

    const tasks = await this.searchRepository.searchTasks(query.trim(), workspaceIds, limit);
    return { tasks };
  }
}
