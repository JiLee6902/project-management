import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LabelService } from '../service/label.service';
import { CreateLabelDto, UpdateLabelDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { User, CurrentUser } from '@app/shared-libs';

@Controller('labels')
@UseGuards(JwtAuthGuard)
export class LabelController {
  constructor(private readonly labelService: LabelService) {}

  @Post()
  async create(@User() user: CurrentUser, @Body() dto: CreateLabelDto) {
    const label = await this.labelService.create(user.id, dto);
    return { label, message: 'Label created successfully' };
  }

  @Get('workspace/:workspaceId')
  async findByWorkspace(
    @User() user: CurrentUser,
    @Param('workspaceId') workspaceId: string,
  ) {
    const labels = await this.labelService.findByWorkspace(workspaceId, user.id);
    return { labels };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const label = await this.labelService.findById(id);
    return { label };
  }

  @Put(':id')
  async update(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateLabelDto,
  ) {
    const label = await this.labelService.update(user.id, id, dto);
    return { label, message: 'Label updated successfully' };
  }

  @Delete(':id')
  async delete(@User() user: CurrentUser, @Param('id') id: string) {
    await this.labelService.delete(user.id, id);
    return { message: 'Label deleted successfully' };
  }
}
