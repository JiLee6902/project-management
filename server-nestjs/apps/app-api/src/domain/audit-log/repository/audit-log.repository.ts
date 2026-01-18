import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { AuditLog, AuditAction, AuditEntity } from '@app/entity/entities/audit-log.entity';

export interface AuditLogQueryOptions {
  userId?: string;
  workspaceId?: string;
  projectId?: string;
  entityType?: AuditEntity;
  entityId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
  ) {}

  async create(data: Partial<AuditLog>): Promise<AuditLog> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<AuditLog | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findWithFilters(options: AuditLogQueryOptions): Promise<{ logs: AuditLog[]; total: number }> {
    const queryBuilder = this.repository.createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .orderBy('audit.createdAt', 'DESC');

    if (options.userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId: options.userId });
    }

    if (options.workspaceId) {
      queryBuilder.andWhere('audit.workspaceId = :workspaceId', { workspaceId: options.workspaceId });
    }

    if (options.projectId) {
      queryBuilder.andWhere('audit.projectId = :projectId', { projectId: options.projectId });
    }

    if (options.entityType) {
      queryBuilder.andWhere('audit.entityType = :entityType', { entityType: options.entityType });
    }

    if (options.entityId) {
      queryBuilder.andWhere('audit.entityId = :entityId', { entityId: options.entityId });
    }

    if (options.action) {
      queryBuilder.andWhere('audit.action = :action', { action: options.action });
    }

    if (options.startDate && options.endDate) {
      queryBuilder.andWhere('audit.createdAt BETWEEN :startDate AND :endDate', {
        startDate: options.startDate,
        endDate: options.endDate,
      });
    } else if (options.startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', { startDate: options.startDate });
    } else if (options.endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', { endDate: options.endDate });
    }

    const total = await queryBuilder.getCount();

    if (options.limit) {
      queryBuilder.take(options.limit);
    }

    if (options.offset) {
      queryBuilder.skip(options.offset);
    }

    const logs = await queryBuilder.getMany();

    return { logs, total };
  }

  async getEntityHistory(entityType: AuditEntity, entityId: string): Promise<AuditLog[]> {
    return this.repository.find({
      where: { entityType, entityId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserActivity(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async deleteOldLogs(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected ?? 0;
  }

  async getStatistics(workspaceId: string, startDate: Date, endDate: Date): Promise<any> {
    const actionCounts = await this.repository
      .createQueryBuilder('audit')
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('audit.workspaceId = :workspaceId', { workspaceId })
      .andWhere('audit.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('audit.action')
      .getRawMany();

    const entityCounts = await this.repository
      .createQueryBuilder('audit')
      .select('audit.entityType', 'entityType')
      .addSelect('COUNT(*)', 'count')
      .where('audit.workspaceId = :workspaceId', { workspaceId })
      .andWhere('audit.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('audit.entityType')
      .getRawMany();

    const userActivity = await this.repository
      .createQueryBuilder('audit')
      .select('audit.userId', 'userId')
      .addSelect('user.name', 'userName')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('audit.user', 'user')
      .where('audit.workspaceId = :workspaceId', { workspaceId })
      .andWhere('audit.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('audit.userId')
      .addGroupBy('user.name')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      actionCounts,
      entityCounts,
      userActivity,
    };
  }
}
