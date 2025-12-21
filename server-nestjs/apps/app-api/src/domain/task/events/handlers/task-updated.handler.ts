import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TaskUpdatedEvent } from '../task-updated.event';
import { WebSocketService, RedisCacheService } from '@app/external-infra';

@EventsHandler(TaskUpdatedEvent)
export class TaskUpdatedHandler implements IEventHandler<TaskUpdatedEvent> {
  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly cacheService: RedisCacheService,
  ) {}

  async handle(event: TaskUpdatedEvent) {
    const { task, project } = event;

    this.webSocketService.emitTaskUpdated({
      task,
      projectId: project.id,
      workspaceId: project.workspaceId,
    });

    const taskCacheKey = this.cacheService.buildKey('task', task.id);
    const projectTasksCacheKey = this.cacheService.buildKey('tasks:project', project.id);

    await Promise.all([
      this.cacheService.del(taskCacheKey),
      this.cacheService.del(projectTasksCacheKey),
    ]);
  }
}
