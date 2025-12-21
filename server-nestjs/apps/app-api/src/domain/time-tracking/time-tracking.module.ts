import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeEntry, Task } from '@app/entity/entities';
import { TimeTrackingController } from './controller/time-tracking.controller';
import { TimeTrackingService } from './service/time-tracking.service';
import { TimeTrackingRepository } from './repository/time-tracking.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TimeEntry, Task])],
  controllers: [TimeTrackingController],
  providers: [TimeTrackingService, TimeTrackingRepository],
  exports: [TimeTrackingService],
})
export class TimeTrackingModule {}
