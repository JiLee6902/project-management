import { Injectable } from '@nestjs/common';
import { SearchRepository, SearchResult } from '../repository/search.repository';

export interface GlobalSearchOptions {
  includeComments?: boolean;
  includeUsers?: boolean;
  limit?: number;
}

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

  async searchProjects(userId: string, query: string, limit = 10) {
    if (!query || query.trim().length < 2) {
      return { projects: [] };
    }

    const workspaceIds = await this.searchRepository.getUserWorkspaceIds(userId);
    if (workspaceIds.length === 0) {
      return { projects: [] };
    }

    const projects = await this.searchRepository.searchProjects(query.trim(), workspaceIds, limit);
    return { projects };
  }

  async searchUsers(userId: string, query: string, limit = 10) {
    if (!query || query.trim().length < 2) {
      return { users: [] };
    }

    const workspaceIds = await this.searchRepository.getUserWorkspaceIds(userId);
    if (workspaceIds.length === 0) {
      return { users: [] };
    }

    const users = await this.searchRepository.searchUsers(query.trim(), workspaceIds, limit);
    return { users };
  }

  async globalSearch(
    userId: string,
    query: string,
    options?: GlobalSearchOptions,
  ): Promise<{ results: SearchResult[]; total: number }> {
    if (!query || query.trim().length < 2) {
      return { results: [], total: 0 };
    }

    const workspaceIds = await this.searchRepository.getUserWorkspaceIds(userId);
    if (workspaceIds.length === 0) {
      return { results: [], total: 0 };
    }

    const results = await this.searchRepository.globalSearch(
      query.trim(),
      workspaceIds,
      options,
    );

    return { results, total: results.length };
  }

  async getSearchSuggestions(userId: string, limit = 5): Promise<string[]> {
    const workspaceIds = await this.searchRepository.getUserWorkspaceIds(userId);
    if (workspaceIds.length === 0) {
      return [];
    }

    // Get project IDs for workspaces
    const projects = await this.searchRepository['projectRepository'].find({
      where: { workspaceId: { $in: workspaceIds } as any },
      select: ['id'],
    });
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) {
      return [];
    }

    return this.searchRepository.getSearchSuggestions(projectIds, limit);
  }

  // Fuzzy search fallback when full-text search returns no results
  async fuzzySearch(userId: string, query: string, limit = 10) {
    if (!query || query.trim().length < 2) {
      return { tasks: [] };
    }

    const workspaceIds = await this.searchRepository.getUserWorkspaceIds(userId);
    if (workspaceIds.length === 0) {
      return { tasks: [] };
    }

    // Get project IDs for workspaces
    const projects = await this.searchRepository['projectRepository'].find({
      where: { workspaceId: { $in: workspaceIds } as any },
      select: ['id'],
    });
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) {
      return { tasks: [] };
    }

    const tasks = await this.searchRepository.fuzzySearchTasks(query.trim(), projectIds, limit);
    return { tasks };
  }

  // Combined search with fuzzy fallback
  async smartSearch(userId: string, query: string, limit = 10) {
    // First try full-text search
    const result = await this.searchTasks(userId, query, limit);

    // If no results, try fuzzy search
    if (result.tasks.length === 0) {
      return this.fuzzySearch(userId, query, limit);
    }

    return result;
  }
}
