import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TaskCreatedEvent } from '../task-created.event';
import { KafkaProducerService, NotificationEventDto, WebSocketService, RedisCacheService } from '@app/external-infra';
import { TaskRepository } from '../../repository/task.repository';

@EventsHandler(TaskCreatedEvent)
export class TaskCreatedHandler implements IEventHandler<TaskCreatedEvent> {
  constructor(
    private readonly kafkaProducer: KafkaProducerService,
    private readonly webSocketService: WebSocketService,
    private readonly taskRepository: TaskRepository,
    private readonly cacheService: RedisCacheService,
  ) {}

  async handle(event: TaskCreatedEvent) {
    const { task, project, dto } = event;

    if (dto.assigneeId) {
      const assignee = await this.taskRepository.findUser(dto.assigneeId);
      if (assignee) {
        try {
          await this.kafkaProducer.sendNotification(
            NotificationEventDto.taskAssigned({
              userId: assignee.id,
              userEmail: assignee.email,
              userName: assignee.name || assignee.email,
              taskId: task.id,
              taskTitle: task.title,
              taskDescription: task.description,
              projectName: project.name,
              dueDate: task.dueDate,
              origin: dto.origin,
            }),
          );
        } catch (error) {
          console.error('Failed to send Kafka notification:', error);
        }
      }
    }

    this.webSocketService.emitTaskCreated({
      task,
      projectId: project.id,
      workspaceId: project.workspaceId,
    });

    const cacheKey = this.cacheService.buildKey('tasks:project', project.id);
    await this.cacheService.del(cacheKey);
  }
}
