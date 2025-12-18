import { Controller, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { User, CurrentUser } from '@app/shared-libs';
import { TaskService } from '../service/task.service';
import { CreateTaskDto, UpdateTaskDto, DeleteTasksDto } from '../dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async createTask(
    @User() user: CurrentUser,
    @Body() dto: CreateTaskDto,
  ) {
    return this.taskService.createTask(user.id, dto);
  }

  @Put(':id')
  async updateTask(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.updateTask(user.id, id, dto);
  }

  @Post('delete')
  async deleteTasks(
    @User() user: CurrentUser,
    @Body() dto: DeleteTasksDto,
  ) {
    return this.taskService.deleteTasks(user.id, dto);
  }
}
