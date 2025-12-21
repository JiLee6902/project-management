import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetTaskQuery } from '../get-task.query';
import { TaskRepository } from '../../repository/task.repository';
import { RedisCacheService, CACHE_TTL } from '@app/external-infra';

const CACHE_PREFIX = 'task';

@QueryHandler(GetTaskQuery)
export class GetTaskHandler implements IQueryHandler<GetTaskQuery> {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly cacheService: RedisCacheService,
  ) {}

  async execute(query: GetTaskQuery) {
    const { taskId } = query;

    const cacheKey = this.cacheService.buildKey(CACHE_PREFIX, taskId);

    const task = await this.cacheService.getOrSet(
      cacheKey,
      () => this.taskRepository.findById(taskId),
      CACHE_TTL.MEDIUM,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }
}
