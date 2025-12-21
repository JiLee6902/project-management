import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTasksByProjectQuery } from '../get-tasks-by-project.query';
import { TaskRepository } from '../../repository/task.repository';
import { RedisCacheService, CACHE_TTL } from '@app/external-infra';

const CACHE_PREFIX = 'tasks:project';

@QueryHandler(GetTasksByProjectQuery)
export class GetTasksByProjectHandler implements IQueryHandler<GetTasksByProjectQuery> {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly cacheService: RedisCacheService,
  ) {}

  async execute(query: GetTasksByProjectQuery) {
    const { projectId } = query;

    const cacheKey = this.cacheService.buildKey(CACHE_PREFIX, projectId);

    const tasks = await this.cacheService.getOrSet(
      cacheKey,
      () => this.taskRepository.findByProject(projectId),
      CACHE_TTL.SHORT,
    );

    return tasks || [];
  }
}
