import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AttachmentRepository } from '../repository/attachment.repository';
import { TaskAttachment } from '@app/entity/entities';
import { StorageService } from '@app/external-infra/storage';
import { FileVisibility, FileType } from '@app/entity/enums';
import { ActivityService } from '../../activity/service/activity.service';
import { ActivityType } from '@app/entity/entities';

@Injectable()
export class AttachmentService {
  constructor(
    private readonly attachmentRepository: AttachmentRepository,
    private readonly storageService: StorageService,
    private readonly activityService: ActivityService,
  ) {}

  async uploadAttachment(
    taskId: string,
    projectId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<TaskAttachment> {
    // Upload file to storage
    const uploadResult = await this.storageService.uploadFile({
      file,
      userId,
      visibility: FileVisibility.PUBLIC,
      fileType: file.mimetype.startsWith('image/') ? FileType.IMAGE : FileType.DOCUMENT,
    });

    // Create attachment record
    const attachment = await this.attachmentRepository.create({
      taskId,
      fileName: uploadResult.fileKey,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: uploadResult.url,
      fileKey: uploadResult.fileKey,
      uploadedBy: userId,
    });

    // Log activity
    await this.activityService.logActivity(
      userId,
      projectId,
      ActivityType.TASK_UPDATED,
      {
        taskId,
        description: 'added an attachment',
        metadata: { attachmentName: file.originalname },
      },
    );

    if (!attachment) {
      throw new NotFoundException('Failed to create attachment');
    }

    return attachment;
  }

  async uploadMultipleAttachments(
    taskId: string,
    projectId: string,
    userId: string,
    files: Express.Multer.File[],
  ): Promise<TaskAttachment[]> {
    const attachments: TaskAttachment[] = [];

    for (const file of files) {
      const attachment = await this.uploadAttachment(taskId, projectId, userId, file);
      if (attachment) {
        attachments.push(attachment);
      }
    }

    return attachments;
  }

  async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    return this.attachmentRepository.findByTaskId(taskId);
  }

  async getAttachmentById(id: string): Promise<TaskAttachment> {
    const attachment = await this.attachmentRepository.findById(id);
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    return attachment;
  }

  async deleteAttachment(
    id: string,
    userId: string,
    projectId: string,
  ): Promise<void> {
    const attachment = await this.getAttachmentById(id);

    // Delete from storage if we have a file key
    if (attachment.fileKey) {
      try {
        await this.storageService.deleteFile(attachment.fileKey);
      } catch (error) {
        // Continue even if storage delete fails
        console.error('Failed to delete file from storage:', error);
      }
    }

    // Delete record
    await this.attachmentRepository.delete(id);

    // Log activity
    await this.activityService.logActivity(
      userId,
      projectId,
      ActivityType.TASK_UPDATED,
      {
        taskId: attachment.taskId,
        description: 'removed an attachment',
        metadata: { attachmentName: attachment.originalName },
      },
    );
  }
}
