export * from './get-task.handler';
export * from './get-tasks-by-project.handler';

import { GetTaskHandler } from './get-task.handler';
import { GetTasksByProjectHandler } from './get-tasks-by-project.handler';

export const QueryHandlers = [
  GetTaskHandler,
  GetTasksByProjectHandler,
];
