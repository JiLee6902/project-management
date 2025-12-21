import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { User, CurrentUser } from '@app/shared-libs';
import { TimeTrackingService } from '../service/time-tracking.service';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from '../dto';

@Controller('time-tracking')
@UseGuards(JwtAuthGuard)
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Get('task/:taskId')
  async getTaskTimeEntries(@Param('taskId') taskId: string) {
    return this.timeTrackingService.getTaskTimeEntries(taskId);
  }

  @Get('user')
  async getUserTimeEntries(
    @User() user: CurrentUser,
    @Query('limit') limit?: string,
  ) {
    return this.timeTrackingService.getUserTimeEntries(
      user.id,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Post()
  async createTimeEntry(
    @User() user: CurrentUser,
    @Body() dto: CreateTimeEntryDto,
  ) {
    return this.timeTrackingService.createTimeEntry(user.id, dto);
  }

  @Put(':id')
  async updateTimeEntry(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateTimeEntryDto,
  ) {
    return this.timeTrackingService.updateTimeEntry(user.id, id, dto);
  }

  @Delete(':id')
  async deleteTimeEntry(
    @User() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.timeTrackingService.deleteTimeEntry(user.id, id);
  }

  @Post('start/:taskId')
  async startTimer(
    @User() user: CurrentUser,
    @Param('taskId') taskId: string,
    @Body('description') description?: string,
  ) {
    return this.timeTrackingService.startTimer(user.id, taskId, description);
  }

  @Post('stop/:entryId')
  async stopTimer(
    @User() user: CurrentUser,
    @Param('entryId') entryId: string,
  ) {
    return this.timeTrackingService.stopTimer(user.id, entryId);
  }
}
