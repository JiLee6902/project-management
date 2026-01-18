import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task, TimeEntry, Activity, Sprint } from '@app/entity/entities';
import { ReportController } from './controller/report.controller';
import { ReportService } from './service/report.service';
import { ReportRepository } from './repository/report.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TimeEntry, Activity, Sprint])],
  controllers: [ReportController],
  providers: [ReportService, ReportRepository],
  exports: [ReportService],
})
export class ReportModule {}
