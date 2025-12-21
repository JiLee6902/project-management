import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SavedFilterService } from '../service/saved-filter.service';
import { CreateSavedFilterDto, UpdateSavedFilterDto } from '../dto/create-saved-filter.dto';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';

@ApiTags('Saved Filters')
@ApiBearerAuth()
@Controller('saved-filters')
@UseGuards(JwtAuthGuard)
export class SavedFilterController {
  constructor(private readonly savedFilterService: SavedFilterService) {}

  @Post()
  async create(
    @Body() dto: CreateSavedFilterDto,
    @Request() req: any,
  ) {
    const filter = await this.savedFilterService.create(req.user.id, dto);
    return { filter, message: 'Filter saved successfully' };
  }

  @Get()
  async getMyFilters(
    @Query('projectId') projectId: string,
    @Request() req: any,
  ) {
    const filters = projectId
      ? await this.savedFilterService.getByUserAndProject(req.user.id, projectId)
      : await this.savedFilterService.getByUser(req.user.id);
    return { filters };
  }

  @Get('default')
  async getDefault(
    @Query('projectId') projectId: string,
    @Request() req: any,
  ) {
    const filter = await this.savedFilterService.getDefault(req.user.id, projectId);
    return { filter };
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const filter = await this.savedFilterService.getById(id, req.user.id);
    return { filter };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSavedFilterDto,
    @Request() req: any,
  ) {
    const filter = await this.savedFilterService.update(id, req.user.id, dto);
    return { filter, message: 'Filter updated successfully' };
  }

  @Put(':id/set-default')
  async setAsDefault(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const filter = await this.savedFilterService.setAsDefault(id, req.user.id);
    return { filter, message: 'Filter set as default' };
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    await this.savedFilterService.delete(id, req.user.id);
    return { message: 'Filter deleted successfully' };
  }
}
