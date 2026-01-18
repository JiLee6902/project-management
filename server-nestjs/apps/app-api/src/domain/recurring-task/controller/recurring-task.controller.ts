import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guard';
import { User } from '@app/shared-libs';
import { RecurringTaskService } from '../service/recurring-task.service';
import { CreateRecurringTaskDto, UpdateRecurringTaskDto } from '../dto';

@ApiTags('Recurring Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/recurring-tasks')
export class RecurringTaskController {
  constructor(private readonly recurringTaskService: RecurringTaskService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a recurring task' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 201, description: 'Recurring task created' })
  async create(
    @Param('projectId') projectId: string,
    @User('id') userId: string,
    @Body() dto: CreateRecurringTaskDto,
  ) {
    return this.recurringTaskService.create(projectId, userId, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all recurring tasks for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'List of recurring tasks' })
  async findByProject(@Param('projectId') projectId: string) {
    return this.recurringTaskService.findByProject(projectId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get recurring task details' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'id', description: 'Recurring task ID' })
  @ApiResponse({ status: 200, description: 'Recurring task details' })
  async findById(@Param('id') id: string) {
    return this.recurringTaskService.findById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update recurring task' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'id', description: 'Recurring task ID' })
  @ApiResponse({ status: 200, description: 'Recurring task updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRecurringTaskDto,
  ) {
    return this.recurringTaskService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete recurring task' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'id', description: 'Recurring task ID' })
  @ApiResponse({ status: 204, description: 'Recurring task deleted' })
  async delete(@Param('id') id: string) {
    return this.recurringTaskService.delete(id);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause recurring task' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'id', description: 'Recurring task ID' })
  @ApiResponse({ status: 200, description: 'Recurring task paused' })
  async pause(@Param('id') id: string) {
    return this.recurringTaskService.pause(id);
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume recurring task' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'id', description: 'Recurring task ID' })
  @ApiResponse({ status: 200, description: 'Recurring task resumed' })
  async resume(@Param('id') id: string) {
    return this.recurringTaskService.resume(id);
  }

  @Post(':id/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Manually generate a task from recurring task' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'id', description: 'Recurring task ID' })
  @ApiResponse({ status: 201, description: 'Task generated' })
  async generateNow(@Param('id') id: string) {
    return this.recurringTaskService.generateTaskNow(id);
  }
}
