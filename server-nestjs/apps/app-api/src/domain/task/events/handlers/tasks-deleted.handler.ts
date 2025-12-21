import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TasksDeletedEvent } from '../tasks-deleted.event';
import { WebSocketService, RedisCacheService } from '@app/external-infra';

@EventsHandler(TasksDeletedEvent)
export class TasksDeletedHandler implements IEventHandler<TasksDeletedEvent> {
  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly cacheService: RedisCacheService,
  ) {}

  async handle(event: TasksDeletedEvent) {
    const { taskIds, projectId, workspaceId } = event;

    this.webSocketService.emitTaskDeleted({
      taskIds,
      projectId,
      workspaceId,
    });

    const projectTasksCacheKey = this.cacheService.buildKey('tasks:project', projectId);
    await this.cacheService.del(projectTasksCacheKey);

    for (const taskId of taskIds) {
      const taskCacheKey = this.cacheService.buildKey('task', taskId);
      await this.cacheService.del(taskCacheKey);
    }
  }
}
