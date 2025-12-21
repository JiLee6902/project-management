import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskAttachment } from '@app/entity/entities';

@Injectable()
export class AttachmentRepository {
  constructor(
    @InjectRepository(TaskAttachment)
    private readonly attachmentRepository: Repository<TaskAttachment>,
  ) {}

  async create(data: Partial<TaskAttachment>): Promise<TaskAttachment | null> {
    const attachment = this.attachmentRepository.create(data);
    const saved = await this.attachmentRepository.save(attachment);
    return this.findById(saved.id);
  }

  async findById(id: string): Promise<TaskAttachment | null> {
    return this.attachmentRepository.findOne({
      where: { id },
      relations: ['uploader'],
    });
  }

  async findByTaskId(taskId: string): Promise<TaskAttachment[]> {
    return this.attachmentRepository.find({
      where: { taskId },
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
    });
  }

  async delete(id: string): Promise<void> {
    await this.attachmentRepository.delete(id);
  }

  async deleteByTaskId(taskId: string): Promise<void> {
    await this.attachmentRepository.delete({ taskId });
  }
}
