import { Task, Project } from '@app/entity/entities';
import { CreateTaskDto } from '../dto';

export class TaskCreatedEvent {
  constructor(
    public readonly task: Task,
    public readonly project: Project,
    public readonly dto: CreateTaskDto,
  ) {}
}
