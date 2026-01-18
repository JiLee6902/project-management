import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Task, Project, ProjectMember, User, WorkspaceMember, Label, Subtask, TaskTemplate, Sprint, TaskDependency, TaskWatcher } from '@app/entity/entities';
import { TaskController } from './controller/task.controller';
import { TaskService } from './service/task.service';
import { TaskRepository } from './repository/task.repository';
import { CommandHandlers } from './commands/handlers';
import { QueryHandlers } from './queries/handlers';
import { EventHandlers } from './events/handlers';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Project, ProjectMember, User, WorkspaceMember, Label, Subtask, TaskTemplate, Sprint, TaskDependency, TaskWatcher]),
    CqrsModule,
  ],
  controllers: [TaskController],
  providers: [
    TaskService,
    TaskRepository,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [TaskService, TaskRepository],
})
export class TaskModule {}
