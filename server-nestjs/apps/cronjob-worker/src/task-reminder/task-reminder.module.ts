import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task, User, Project } from '@app/entity/entities';
import { EmailModule } from '@app/external-infra';
import { TaskReminderCron } from './task-reminder.cron';
import { TaskReminderService } from './task-reminder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User, Project]),
    EmailModule,
  ],
  providers: [TaskReminderCron, TaskReminderService],
})
export class TaskReminderModule {}
