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
import { AutomationService } from '../service/automation.service';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { User, CurrentUser } from '@app/shared-libs';
import { AutomationTrigger, AutomationAction } from '@app/entity/entities';

@ApiTags('Automation')
@ApiBearerAuth()
@Controller('automation')
@UseGuards(JwtAuthGuard)
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get('project/:projectId')
  async getProjectRules(@Param('projectId') projectId: string) {
    return this.automationService.getProjectRules(projectId);
  }

  @Post()
  async createRule(
    @User() user: CurrentUser,
    @Body() dto: {
      name: string;
      description?: string;
      projectId: string;
      trigger: AutomationTrigger;
      triggerConditions?: any;
      action: AutomationAction;
      actionParams: any;
    },
  ) {
    return this.automationService.createRule(user.id, dto);
  }

  @Put(':id')
  async updateRule(
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      description?: string;
      triggerConditions?: any;
      actionParams?: any;
      isActive?: boolean;
    },
  ) {
    return this.automationService.updateRule(id, dto);
  }

  @Put(':id/toggle')
  async toggleRule(@Param('id') id: string) {
    return this.automationService.toggleRule(id);
  }

  @Delete(':id')
  async deleteRule(@Param('id') id: string) {
    return this.automationService.deleteRule(id);
  }
}
