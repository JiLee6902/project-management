import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, ActivityType } from '@app/entity/entities';

@Injectable()
export class ActivityRepository {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async create(data: Partial<Activity>): Promise<Activity | null> {
    const activity = this.activityRepository.create(data);
    const saved = await this.activityRepository.save(activity);
    // Fetch with relations for WebSocket events
    return this.activityRepository.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });
  }

  async findByProject(projectId: string, limit = 50, offset = 0): Promise<Activity[]> {
    return this.activityRepository.find({
      where: { projectId },
      relations: ['user', 'task'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findByTask(taskId: string, limit = 50, offset = 0): Promise<Activity[]> {
    return this.activityRepository.find({
      where: { taskId },
      relations: ['user', 'task'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findByUser(userId: string, limit = 50, offset = 0): Promise<Activity[]> {
    return this.activityRepository.find({
      where: { userId },
      relations: ['user', 'task', 'project'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async countByProject(projectId: string): Promise<number> {
    return this.activityRepository.count({ where: { projectId } });
  }

  async countByTask(taskId: string): Promise<number> {
    return this.activityRepository.count({ where: { taskId } });
  }
}
