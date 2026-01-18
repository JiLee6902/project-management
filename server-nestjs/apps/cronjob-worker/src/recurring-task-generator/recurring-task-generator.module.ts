import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '@app/entity/entities';
import { RecurringTask } from '@app/entity/entities/recurring-task.entity';
import { RecurringTaskGeneratorService } from './recurring-task-generator.service';

@Module({
  imports: [TypeOrmModule.forFeature([RecurringTask, Task])],
  providers: [RecurringTaskGeneratorService],
})
export class RecurringTaskGeneratorModule {}
