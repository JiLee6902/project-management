import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BloomFilterRebuildService } from './bloom-filter-rebuild.service';

@Injectable()
export class BloomFilterRebuildCron {
  constructor(
    private readonly bloomFilterRebuildService: BloomFilterRebuildService,
  ) {}

  @Cron('0 3 * * *', {
    name: 'bloom-filter-rebuild',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleBloomFilterRebuild() {
    console.log('Starting Bloom Filter rebuild cron job...');

    try {
      const result = await this.bloomFilterRebuildService.rebuildAllFilters();

      console.log('Bloom Filter rebuild completed:', {
        projects: result.projects,
        tasks: result.tasks,
        users: result.users,
        workspaces: result.workspaces,
      });
    } catch (error) {
      console.error('Bloom Filter rebuild failed:', error);
    }
  }
}
