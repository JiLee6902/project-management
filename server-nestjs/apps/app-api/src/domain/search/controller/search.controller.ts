import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { SearchService } from '../service/search.service';

@ApiTags('Search')
@ApiBearerAuth()
@Controller('search')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search tasks and projects' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(@Request() req: any, @Query('q') query: string) {
    return this.searchService.search(req.user.id, query);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Search only tasks' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Task search results' })
  async searchTasks(
    @Request() req: any,
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.searchTasks(req.user.id, query, limit || 10);
  }

  @Get('projects')
  @ApiOperation({ summary: 'Search only projects' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Project search results' })
  async searchProjects(
    @Request() req: any,
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.searchProjects(req.user.id, query, limit || 10);
  }

  @Get('users')
  @ApiOperation({ summary: 'Search users in workspace' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'User search results' })
  async searchUsers(
    @Request() req: any,
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.searchUsers(req.user.id, query, limit || 10);
  }

  @Get('global')
  @ApiOperation({ summary: 'Global search across all entities' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'includeComments', required: false, type: Boolean })
  @ApiQuery({ name: 'includeUsers', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Global search results' })
  async globalSearch(
    @Request() req: any,
    @Query('q') query: string,
    @Query('includeComments') includeComments?: string,
    @Query('includeUsers') includeUsers?: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.globalSearch(req.user.id, query, {
      includeComments: includeComments === 'true',
      includeUsers: includeUsers === 'true',
      limit: limit || 20,
    });
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions based on recent activity' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Search suggestions' })
  async getSuggestions(
    @Request() req: any,
    @Query('limit') limit?: number,
  ) {
    const suggestions = await this.searchService.getSearchSuggestions(req.user.id, limit || 5);
    return { suggestions };
  }

  @Get('smart')
  @ApiOperation({ summary: 'Smart search with fuzzy fallback' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Smart search results' })
  async smartSearch(
    @Request() req: any,
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.smartSearch(req.user.id, query, limit || 10);
  }
}
