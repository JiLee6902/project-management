import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '@app/entity/entities';
import { RecurringTask } from '@app/entity/entities/recurring-task.entity';
import { RecurringTaskController } from './controller/recurring-task.controller';
import { RecurringTaskService } from './service/recurring-task.service';
import { RecurringTaskRepository } from './repository/recurring-task.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RecurringTask, Task])],
  controllers: [RecurringTaskController],
  providers: [RecurringTaskService, RecurringTaskRepository],
  exports: [RecurringTaskService],
})
export class RecurringTaskModule {}
