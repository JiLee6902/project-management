import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { User, CurrentUser } from '@app/shared-libs';
import { TaskTemplateService } from './task-template.service';
import { CreateTaskTemplateDto, UpdateTaskTemplateDto } from './dto';

@Controller('task-templates')
@UseGuards(JwtAuthGuard)
export class TaskTemplateController {
  constructor(private readonly taskTemplateService: TaskTemplateService) {}

  @Get('workspace/:workspaceId')
  async getTemplatesByWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.taskTemplateService.getTemplatesByWorkspace(workspaceId);
  }

  @Get(':id')
  async getTemplate(@Param('id') id: string) {
    return this.taskTemplateService.getTemplateById(id);
  }

  @Post()
  async createTemplate(
    @User() user: CurrentUser,
    @Body() dto: CreateTaskTemplateDto,
  ) {
    return this.taskTemplateService.createTemplate(user.id, dto);
  }

  @Put(':id')
  async updateTemplate(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskTemplateDto,
  ) {
    return this.taskTemplateService.updateTemplate(user.id, id, dto);
  }

  @Delete(':id')
  async deleteTemplate(
    @User() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.taskTemplateService.deleteTemplate(user.id, id);
  }
}
