import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project, Task, User, Workspace } from '@app/entity/entities';
import { BloomFilterRebuildCron } from './bloom-filter-rebuild.cron';
import { BloomFilterRebuildService } from './bloom-filter-rebuild.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Task, User, Workspace])],
  providers: [BloomFilterRebuildCron, BloomFilterRebuildService],
})
export class BloomFilterRebuildModule {}
