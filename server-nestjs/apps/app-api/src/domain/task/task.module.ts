import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task, Project, ProjectMember, User } from '@app/entity/entities';
import { KafkaModule } from '@app/external-infra';
import { TaskController } from './controller/task.controller';
import { TaskService } from './service/task.service';
import { TaskRepository } from './repository/task.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Project, ProjectMember, User]),
    KafkaModule,
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskRepository],
  exports: [TaskService, TaskRepository],
})
export class TaskModule {}
