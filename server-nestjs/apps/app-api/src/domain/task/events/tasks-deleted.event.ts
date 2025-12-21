export class TasksDeletedEvent {
  constructor(
    public readonly taskIds: string[],
    public readonly projectId: string,
    public readonly workspaceId: string,
  ) {}
}
