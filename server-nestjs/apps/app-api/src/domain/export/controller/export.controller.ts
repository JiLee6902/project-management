import { Controller, Get, Param, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { ExportService } from '../service/export.service';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('project/:projectId/tasks')
  async exportProjectTasks(
    @Param('projectId') projectId: string,
    @Query('format') format: 'csv' | 'json' = 'csv',
    @Res() res: Response,
  ) {
    if (format === 'json') {
      const data = await this.exportService.exportProjectTasks(projectId, 'json');
      return res.json(data);
    }

    const result = await this.exportService.exportProjectTasks(projectId, 'csv');
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.content);
  }

  @Get('project/:projectId/summary')
  async exportProjectSummary(@Param('projectId') projectId: string) {
    return this.exportService.exportProjectSummary(projectId);
  }
}
