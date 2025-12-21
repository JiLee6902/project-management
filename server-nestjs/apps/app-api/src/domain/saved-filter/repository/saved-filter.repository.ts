import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedFilter } from '@app/entity/entities';

@Injectable()
export class SavedFilterRepository {
  constructor(
    @InjectRepository(SavedFilter)
    private readonly savedFilterRepository: Repository<SavedFilter>,
  ) {}

  async create(data: Partial<SavedFilter>): Promise<SavedFilter> {
    const filter = this.savedFilterRepository.create(data);
    return this.savedFilterRepository.save(filter);
  }

  async findById(id: string): Promise<SavedFilter | null> {
    return this.savedFilterRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string): Promise<SavedFilter[]> {
    return this.savedFilterRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserAndProject(userId: string, projectId: string): Promise<SavedFilter[]> {
    return this.savedFilterRepository.find({
      where: { userId, projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findDefaultByUser(userId: string, projectId?: string): Promise<SavedFilter | null> {
    const where: any = { userId, isDefault: true };
    if (projectId) {
      where.projectId = projectId;
    }
    return this.savedFilterRepository.findOne({ where });
  }

  async update(id: string, data: Partial<SavedFilter>): Promise<SavedFilter | null> {
    await this.savedFilterRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.savedFilterRepository.delete(id);
  }

  async clearDefaultByUser(userId: string, projectId?: string): Promise<void> {
    const where: any = { userId, isDefault: true };
    if (projectId) {
      where.projectId = projectId;
    }
    await this.savedFilterRepository.update(where, { isDefault: false });
  }
}
