import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { SearchService } from '../service/search.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Request() req: any, @Query('q') query: string) {
    return this.searchService.search(req.user.id, query);
  }

  @Get('tasks')
  async searchTasks(
    @Request() req: any,
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.searchTasks(req.user.id, query, limit || 10);
  }
}
