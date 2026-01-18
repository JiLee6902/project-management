import { Injectable } from '@nestjs/common';
import { AuditLog, AuditAction, AuditEntity } from '@app/entity/entities/audit-log.entity';
import { AuditLogRepository, AuditLogQueryOptions } from '../repository/audit-log.repository';

export interface CreateAuditLogDto {
  userId?: string;
  workspaceId?: string;
  projectId?: string;
  action: AuditAction;
  entityType: AuditEntity;
  entityId: string;
  entityName?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields?: string[];
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    return this.auditLogRepository.create(dto);
  }

  async logCreate(
    userId: string,
    entityType: AuditEntity,
    entityId: string,
    newValues: Record<string, any>,
    options?: { workspaceId?: string; projectId?: string; entityName?: string; metadata?: Record<string, any> },
  ): Promise<AuditLog> {
    return this.log({
      userId,
      workspaceId: options?.workspaceId,
      projectId: options?.projectId,
      action: AuditAction.CREATE,
      entityType,
      entityId,
      entityName: options?.entityName,
      newValues: this.sanitizeValues(newValues),
      metadata: options?.metadata,
    });
  }

  async logUpdate(
    userId: string,
    entityType: AuditEntity,
    entityId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    options?: { workspaceId?: string; projectId?: string; entityName?: string; metadata?: Record<string, any> },
  ): Promise<AuditLog> {
    const changedFields = this.getChangedFields(oldValues, newValues);

    return this.log({
      userId,
      workspaceId: options?.workspaceId,
      projectId: options?.projectId,
      action: AuditAction.UPDATE,
      entityType,
      entityId,
      entityName: options?.entityName,
      oldValues: this.sanitizeValues(this.pickFields(oldValues, changedFields)),
      newValues: this.sanitizeValues(this.pickFields(newValues, changedFields)),
      changedFields,
      metadata: options?.metadata,
    });
  }

  async logDelete(
    userId: string,
    entityType: AuditEntity,
    entityId: string,
    oldValues: Record<string, any>,
    options?: { workspaceId?: string; projectId?: string; entityName?: string; metadata?: Record<string, any> },
  ): Promise<AuditLog> {
    return this.log({
      userId,
      workspaceId: options?.workspaceId,
      projectId: options?.projectId,
      action: AuditAction.DELETE,
      entityType,
      entityId,
      entityName: options?.entityName,
      oldValues: this.sanitizeValues(oldValues),
      metadata: options?.metadata,
    });
  }

  async findById(id: string): Promise<AuditLog | null> {
    return this.auditLogRepository.findById(id);
  }

  async query(options: AuditLogQueryOptions): Promise<{ logs: AuditLog[]; total: number }> {
    return this.auditLogRepository.findWithFilters(options);
  }

  async getEntityHistory(entityType: AuditEntity, entityId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.getEntityHistory(entityType, entityId);
  }

  async getUserActivity(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.getUserActivity(userId, limit);
  }

  async getStatistics(workspaceId: string, startDate: Date, endDate: Date): Promise<any> {
    return this.auditLogRepository.getStatistics(workspaceId, startDate, endDate);
  }

  async cleanupOldLogs(retentionDays = 90): Promise<number> {
    return this.auditLogRepository.deleteOldLogs(retentionDays);
  }

  private getChangedFields(oldValues: Record<string, any>, newValues: Record<string, any>): string[] {
    const changed: string[] = [];
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    for (const key of allKeys) {
      if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
        changed.push(key);
      }
    }

    return changed;
  }

  private pickFields(obj: Record<string, any>, fields: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    for (const field of fields) {
      if (field in obj) {
        result[field] = obj[field];
      }
    }
    return result;
  }

  private sanitizeValues(values: Record<string, any>): Record<string, any> {
    const sanitized = { ...values };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'secret', 'token', 'refreshToken', 'accessToken'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Remove large fields
    for (const key of Object.keys(sanitized)) {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
        sanitized[key] = sanitized[key].substring(0, 1000) + '...[truncated]';
      }
    }

    return sanitized;
  }
}
