export * from './create-task.handler';
export * from './update-task.handler';
export * from './delete-tasks.handler';

import { CreateTaskHandler } from './create-task.handler';
import { UpdateTaskHandler } from './update-task.handler';
import { DeleteTasksHandler } from './delete-tasks.handler';

export const CommandHandlers = [
  CreateTaskHandler,
  UpdateTaskHandler,
  DeleteTasksHandler,
];
