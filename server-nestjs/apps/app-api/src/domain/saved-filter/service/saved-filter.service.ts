import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SavedFilterRepository } from '../repository/saved-filter.repository';
import { CreateSavedFilterDto, UpdateSavedFilterDto } from '../dto/create-saved-filter.dto';
import { SavedFilter } from '@app/entity/entities';

@Injectable()
export class SavedFilterService {
  constructor(private readonly savedFilterRepository: SavedFilterRepository) {}

  async create(userId: string, dto: CreateSavedFilterDto): Promise<SavedFilter> {
    // If this is set as default, clear other defaults first
    if (dto.isDefault) {
      await this.savedFilterRepository.clearDefaultByUser(userId, dto.projectId);
    }

    return this.savedFilterRepository.create({
      ...dto,
      userId,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  async getByUser(userId: string): Promise<SavedFilter[]> {
    return this.savedFilterRepository.findByUserId(userId);
  }

  async getByUserAndProject(userId: string, projectId: string): Promise<SavedFilter[]> {
    return this.savedFilterRepository.findByUserAndProject(userId, projectId);
  }

  async getById(id: string, userId: string): Promise<SavedFilter> {
    const filter = await this.savedFilterRepository.findById(id);
    if (!filter) {
      throw new NotFoundException('Saved filter not found');
    }
    if (filter.userId !== userId) {
      throw new ForbiddenException('You can only access your own filters');
    }
    return filter;
  }

  async getDefault(userId: string, projectId?: string): Promise<SavedFilter | null> {
    return this.savedFilterRepository.findDefaultByUser(userId, projectId);
  }

  async update(id: string, userId: string, dto: UpdateSavedFilterDto): Promise<SavedFilter> {
    const filter = await this.getById(id, userId);

    // If setting as default, clear other defaults first
    if (dto.isDefault) {
      await this.savedFilterRepository.clearDefaultByUser(userId, filter.projectId);
    }

    const updated = await this.savedFilterRepository.update(id, {
      ...dto,
      updatedBy: userId,
    });

    if (!updated) {
      throw new NotFoundException('Failed to update filter');
    }

    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.getById(id, userId);
    await this.savedFilterRepository.delete(id);
  }

  async setAsDefault(id: string, userId: string): Promise<SavedFilter> {
    const filter = await this.getById(id, userId);
    await this.savedFilterRepository.clearDefaultByUser(userId, filter.projectId);
    const updated = await this.savedFilterRepository.update(id, {
      isDefault: true,
      updatedBy: userId,
    });

    if (!updated) {
      throw new NotFoundException('Failed to set filter as default');
    }

    return updated;
  }
}
