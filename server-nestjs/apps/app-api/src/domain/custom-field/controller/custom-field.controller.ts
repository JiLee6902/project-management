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
import { CustomFieldService } from '../service/custom-field.service';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { User, CurrentUser } from '@app/shared-libs';
import { CustomFieldType } from '@app/entity/entities';

@ApiTags('Custom Fields')
@ApiBearerAuth()
@Controller('custom-fields')
@UseGuards(JwtAuthGuard)
export class CustomFieldController {
  constructor(private readonly customFieldService: CustomFieldService) {}

  @Get('project/:projectId')
  async getProjectFields(@Param('projectId') projectId: string) {
    return this.customFieldService.getProjectFields(projectId);
  }

  @Post()
  async createField(
    @User() user: CurrentUser,
    @Body() dto: {
      projectId: string;
      name: string;
      type: CustomFieldType;
      options?: string[];
      required?: boolean;
    },
  ) {
    return this.customFieldService.createField(user.id, dto);
  }

  @Put(':id')
  async updateField(
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      options?: string[];
      required?: boolean;
      order?: number;
    },
  ) {
    return this.customFieldService.updateField(id, dto);
  }

  @Delete(':id')
  async deleteField(@Param('id') id: string) {
    return this.customFieldService.deleteField(id);
  }

  @Get('task/:taskId/values')
  async getTaskFieldValues(@Param('taskId') taskId: string) {
    return this.customFieldService.getTaskFieldValues(taskId);
  }

  @Post('task/:taskId/values')
  async setTaskFieldValue(
    @Param('taskId') taskId: string,
    @Body() dto: { customFieldId: string; value: string },
  ) {
    return this.customFieldService.setTaskFieldValue(taskId, dto.customFieldId, dto.value);
  }

  @Delete('task/:taskId/values/:customFieldId')
  async deleteTaskFieldValue(
    @Param('taskId') taskId: string,
    @Param('customFieldId') customFieldId: string,
  ) {
    return this.customFieldService.deleteTaskFieldValue(taskId, customFieldId);
  }
}
