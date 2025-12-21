import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AttachmentService } from '../service/attachment.service';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';

@ApiTags('Attachments')
@ApiBearerAuth()
@Controller('attachments')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } })
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Post('task/:taskId')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        projectId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('taskId') taskId: string,
    @Query('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const attachment = await this.attachmentService.uploadAttachment(
      taskId,
      projectId,
      req.user.id,
      file,
    );

    return {
      attachment,
      message: 'Attachment uploaded successfully',
    };
  }

  @Post('task/:taskId/multiple')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        projectId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleAttachments(
    @Param('taskId') taskId: string,
    @Query('projectId') projectId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any,
  ) {
    const attachments = await this.attachmentService.uploadMultipleAttachments(
      taskId,
      projectId,
      req.user.id,
      files,
    );

    return {
      attachments,
      message: `${attachments.length} attachments uploaded successfully`,
    };
  }

  @Get('task/:taskId')
  async getTaskAttachments(@Param('taskId') taskId: string) {
    const attachments = await this.attachmentService.getTaskAttachments(taskId);
    return { attachments };
  }

  @Get(':id')
  async getAttachment(@Param('id') id: string) {
    const attachment = await this.attachmentService.getAttachmentById(id);
    return { attachment };
  }

  @Delete(':id')
  async deleteAttachment(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @Request() req: any,
  ) {
    await this.attachmentService.deleteAttachment(id, req.user.id, projectId);
    return { message: 'Attachment deleted successfully' };
  }
}
