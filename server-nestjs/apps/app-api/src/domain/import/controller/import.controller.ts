import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guard';
import { ImportService } from '../service/import.service';
import {
  ImportConfigDto,
  ImportSource,
  ImportEntity,
  TrelloImportDto,
} from '../dto';

@ApiTags('Import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Preview import file and get suggested mappings' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        source: { type: 'string', enum: ['csv', 'json'] },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Import preview with suggested mappings' })
  async previewImport(
    @UploadedFile() file: Express.Multer.File,
    @Query('source') source: ImportSource,
  ) {
    if (!file) {
      throw new Error('No file provided');
    }
    return this.importService.previewImport(file, source);
  }

  @Post('tasks')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import tasks from CSV or JSON file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        source: { type: 'string', enum: ['csv', 'json'] },
        entity: { type: 'string', enum: ['tasks'] },
        projectId: { type: 'string' },
        skipDuplicates: { type: 'boolean' },
        createLabels: { type: 'boolean' },
        assignToCurrentUser: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Import result' })
  async importTasks(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() config: ImportConfigDto,
  ) {
    if (!file) {
      throw new Error('No file provided');
    }
    return this.importService.importTasks(req.user.id, file, config);
  }

  @Post('trello')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import from Trello board export' })
  @ApiResponse({ status: 200, description: 'Import result' })
  async importFromTrello(
    @Request() req: any,
    @Body() importData: TrelloImportDto,
  ) {
    return this.importService.importFromTrello(req.user.id, importData);
  }

  @Get('template')
  @ApiOperation({ summary: 'Download import template' })
  @ApiQuery({ name: 'entity', enum: ImportEntity })
  @ApiResponse({ status: 200, description: 'CSV template file' })
  async downloadTemplate(
    @Query('entity') entity: ImportEntity,
    @Res() res: Response,
  ) {
    const template = this.importService.getImportTemplate(entity);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${entity}-template.csv`);
    res.send(template);
  }
}
