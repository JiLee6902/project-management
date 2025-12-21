import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TimeTrackingRepository } from '../repository/time-tracking.repository';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from '../dto';

@Injectable()
export class TimeTrackingService {
  constructor(private readonly timeTrackingRepository: TimeTrackingRepository) {}

  async createTimeEntry(userId: string, dto: CreateTimeEntryDto) {
    const task = await this.timeTrackingRepository.findTask(dto.taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const startTime = new Date(dto.startTime);
    const endTime = dto.endTime ? new Date(dto.endTime) : undefined;

    let duration = dto.duration || 0;
    if (endTime && !dto.duration) {
      duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    }

    const entry = await this.timeTrackingRepository.create({
      taskId: dto.taskId,
      userId,
      startTime,
      endTime,
      duration,
      description: dto.description,
      createdBy: userId,
    });

    await this.timeTrackingRepository.updateTaskLoggedTime(dto.taskId);

    return { timeEntry: entry, message: 'Time entry created successfully' };
  }

  async getTaskTimeEntries(taskId: string) {
    const entries = await this.timeTrackingRepository.findByTask(taskId);
    const totalTime = await this.timeTrackingRepository.getTaskTotalTime(taskId);
    return { timeEntries: entries, totalTime };
  }

  async getUserTimeEntries(userId: string, limit = 50) {
    const entries = await this.timeTrackingRepository.findByUser(userId, limit);
    return { timeEntries: entries };
  }

  async updateTimeEntry(userId: string, entryId: string, dto: UpdateTimeEntryDto) {
    const entry = await this.timeTrackingRepository.findById(entryId);
    if (!entry) {
      throw new NotFoundException('Time entry not found');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('You can only update your own time entries');
    }

    const updateData: Partial<typeof entry> = {};

    if (dto.startTime) {
      updateData.startTime = new Date(dto.startTime);
    }
    if (dto.endTime) {
      updateData.endTime = new Date(dto.endTime);
    }
    if (dto.duration !== undefined) {
      updateData.duration = dto.duration;
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    if (updateData.startTime && updateData.endTime && dto.duration === undefined) {
      updateData.duration = Math.floor(
        (updateData.endTime.getTime() - updateData.startTime.getTime()) / 1000,
      );
    }

    await this.timeTrackingRepository.update(entryId, updateData);
    await this.timeTrackingRepository.updateTaskLoggedTime(entry.taskId);

    const updatedEntry = await this.timeTrackingRepository.findById(entryId);
    return { timeEntry: updatedEntry, message: 'Time entry updated successfully' };
  }

  async deleteTimeEntry(userId: string, entryId: string) {
    const entry = await this.timeTrackingRepository.findById(entryId);
    if (!entry) {
      throw new NotFoundException('Time entry not found');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('You can only delete your own time entries');
    }

    const taskId = entry.taskId;
    await this.timeTrackingRepository.delete(entryId);
    await this.timeTrackingRepository.updateTaskLoggedTime(taskId);

    return { message: 'Time entry deleted successfully' };
  }

  async startTimer(userId: string, taskId: string, description?: string) {
    const task = await this.timeTrackingRepository.findTask(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const entry = await this.timeTrackingRepository.create({
      taskId,
      userId,
      startTime: new Date(),
      duration: 0,
      description,
      createdBy: userId,
    });

    return { timeEntry: entry, message: 'Timer started' };
  }

  async stopTimer(userId: string, entryId: string) {
    const entry = await this.timeTrackingRepository.findById(entryId);
    if (!entry) {
      throw new NotFoundException('Time entry not found');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('You can only stop your own timers');
    }

    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - entry.startTime.getTime()) / 1000,
    );

    await this.timeTrackingRepository.update(entryId, { endTime, duration });
    await this.timeTrackingRepository.updateTaskLoggedTime(entry.taskId);

    const updatedEntry = await this.timeTrackingRepository.findById(entryId);
    return { timeEntry: updatedEntry, message: 'Timer stopped' };
  }
}
