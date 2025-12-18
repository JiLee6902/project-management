import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { User, CurrentUser } from '@app/shared-libs';
import { WorkspaceService } from '../service/workspace.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto, AddMemberDto } from '../dto';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  async getUserWorkspaces(@User() user: CurrentUser) {
    return this.workspaceService.getUserWorkspaces(user.id);
  }

  @Post()
  async createWorkspace(
    @User() user: CurrentUser,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspaceService.createWorkspace(user.id, dto);
  }

  @Put(':id')
  async updateWorkspace(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.updateWorkspace(user.id, id, dto);
  }

  @Delete(':id')
  async deleteWorkspace(
    @User() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.workspaceService.deleteWorkspace(user.id, id);
  }

  @Post(':id/members')
  async addMember(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.workspaceService.addMember(user.id, id, dto);
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.workspaceService.removeMember(user.id, id, memberId);
  }
}
