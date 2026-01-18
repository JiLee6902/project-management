import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { RecurringTask, RecurringTaskStatus } from '@app/entity/entities/recurring-task.entity';

@Injectable()
export class RecurringTaskRepository {
  constructor(
    @InjectRepository(RecurringTask)
    private readonly repository: Repository<RecurringTask>,
  ) {}

  async create(data: Partial<RecurringTask>): Promise<RecurringTask> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<RecurringTask | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['project', 'assignee'],
    });
  }

  async findByProject(projectId: string): Promise<RecurringTask[]> {
    return this.repository.find({
      where: { projectId },
      relations: ['assignee'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveByProject(projectId: string): Promise<RecurringTask[]> {
    return this.repository.find({
      where: { projectId, status: RecurringTaskStatus.ACTIVE },
      order: { nextGenerationAt: 'ASC' },
    });
  }

  async findDueForGeneration(): Promise<RecurringTask[]> {
    const now = new Date();
    return this.repository.find({
      where: {
        status: RecurringTaskStatus.ACTIVE,
        nextGenerationAt: LessThanOrEqual(now),
      },
      relations: ['project'],
    });
  }

  async update(id: string, data: Partial<RecurringTask>): Promise<RecurringTask | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async incrementTasksGenerated(id: string): Promise<void> {
    await this.repository.increment({ id }, 'tasksGenerated', 1);
  }

  async updateGenerationTimestamps(
    id: string,
    lastGeneratedAt: Date,
    nextGenerationAt: Date | undefined,
  ): Promise<void> {
    await this.repository.update(id, {
      lastGeneratedAt,
      nextGenerationAt,
    });
  }
}
