export * from './task-created.handler';
export * from './task-updated.handler';
export * from './tasks-deleted.handler';

import { TaskCreatedHandler } from './task-created.handler';
import { TaskUpdatedHandler } from './task-updated.handler';
import { TasksDeletedHandler } from './tasks-deleted.handler';

export const EventHandlers = [
  TaskCreatedHandler,
  TaskUpdatedHandler,
  TasksDeletedHandler,
];
