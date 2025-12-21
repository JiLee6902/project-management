import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectTemplateService } from '../service/project-template.service';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { User, CurrentUser } from '@app/shared-libs';

@ApiTags('Project Templates')
@ApiBearerAuth()
@Controller('project-templates')
@UseGuards(JwtAuthGuard)
export class ProjectTemplateController {
  constructor(private readonly templateService: ProjectTemplateService) {}

  @Get('workspace/:workspaceId')
  async getWorkspaceTemplates(@Param('workspaceId') workspaceId: string) {
    return this.templateService.getWorkspaceTemplates(workspaceId);
  }

  @Get(':id')
  async getTemplate(@Param('id') id: string) {
    return this.templateService.getTemplate(id);
  }

  @Post()
  async createTemplate(
    @User() user: CurrentUser,
    @Body() dto: {
      name: string;
      description?: string;
      workspaceId: string;
      template: any;
      isPublic?: boolean;
    },
  ) {
    return this.templateService.createTemplate(user.id, dto);
  }

  @Post('from-project/:projectId')
  async createFromProject(
    @User() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Body() dto: {
      name: string;
      description?: string;
      isPublic?: boolean;
    },
  ) {
    return this.templateService.createTemplateFromProject(user.id, projectId, dto);
  }

  @Post(':templateId/apply/:projectId')
  async applyToProject(
    @User() user: CurrentUser,
    @Param('templateId') templateId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.templateService.applyTemplateToProject(user.id, templateId, projectId);
  }

  @Put(':id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      description?: string;
      template?: any;
      isPublic?: boolean;
    },
  ) {
    return this.templateService.updateTemplate(id, dto);
  }

  @Delete(':id')
  async deleteTemplate(@Param('id') id: string) {
    return this.templateService.deleteTemplate(id);
  }
}
