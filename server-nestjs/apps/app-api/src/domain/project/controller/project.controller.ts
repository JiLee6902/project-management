import { Controller, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { User, CurrentUser } from '@app/shared-libs';
import { ProjectService } from '../service/project.service';
import { CreateProjectDto, UpdateProjectDto, AddProjectMemberDto } from '../dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async createProject(
    @User() user: CurrentUser,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectService.createProject(user.id, dto);
  }

  @Put(':id')
  async updateProject(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(user.id, id, dto);
  }

  @Delete(':id')
  async deleteProject(
    @User() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.projectService.deleteProject(user.id, id);
  }

  @Post(':projectId/addMember')
  async addMember(
    @User() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Body() dto: AddProjectMemberDto,
  ) {
    return this.projectService.addMember(user.id, projectId, dto);
  }
}
