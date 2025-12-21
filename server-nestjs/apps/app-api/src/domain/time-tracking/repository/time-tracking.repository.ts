import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TimeEntry, Task } from '@app/entity/entities';

@Injectable()
export class TimeTrackingRepository {
  constructor(
    @InjectRepository(TimeEntry)
    private readonly timeEntryRepository: Repository<TimeEntry>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(data: Partial<TimeEntry>): Promise<TimeEntry> {
    const entry = this.timeEntryRepository.create(data);
    return this.timeEntryRepository.save(entry);
  }

  async findById(id: string): Promise<TimeEntry | null> {
    return this.timeEntryRepository.findOne({
      where: { id },
      relations: ['user', 'task'],
    });
  }

  async findByTask(taskId: string): Promise<TimeEntry[]> {
    return this.timeEntryRepository.find({
      where: { taskId },
      relations: ['user'],
      order: { startTime: 'DESC' },
    });
  }

  async findByUser(userId: string, limit = 50): Promise<TimeEntry[]> {
    return this.timeEntryRepository.find({
      where: { userId },
      relations: ['task'],
      order: { startTime: 'DESC' },
      take: limit,
    });
  }

  async findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TimeEntry[]> {
    return this.timeEntryRepository.find({
      where: {
        userId,
        startTime: Between(startDate, endDate),
      },
      relations: ['task'],
      order: { startTime: 'DESC' },
    });
  }

  async update(id: string, data: Partial<TimeEntry>): Promise<void> {
    await this.timeEntryRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.timeEntryRepository.delete(id);
  }

  async findTask(taskId: string): Promise<Task | null> {
    return this.taskRepository.findOne({ where: { id: taskId } });
  }

  async updateTaskLoggedTime(taskId: string): Promise<void> {
    const entries = await this.findByTask(taskId);
    const totalDuration = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    await this.taskRepository.update(taskId, { loggedTime: totalDuration });
  }

  async getTaskTotalTime(taskId: string): Promise<number> {
    const result = await this.timeEntryRepository
      .createQueryBuilder('entry')
      .select('SUM(entry.duration)', 'total')
      .where('entry.taskId = :taskId', { taskId })
      .getRawOne();
    return result?.total || 0;
  }
}
