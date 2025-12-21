import { Task, Project } from '@app/entity/entities';

export class TaskUpdatedEvent {
  constructor(
    public readonly task: Task,
    public readonly project: Project,
  ) {}
}
