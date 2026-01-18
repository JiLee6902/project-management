import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook, WebhookEvent, WebhookStatus, WebhookLog, WebhookDeliveryStatus } from '@app/entity/entities';

@Injectable()
export class WebhookRepository {
  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookLog)
    private readonly webhookLogRepository: Repository<WebhookLog>,
  ) {}

  async create(data: Partial<Webhook>): Promise<Webhook> {
    const webhook = this.webhookRepository.create(data);
    return this.webhookRepository.save(webhook);
  }

  async findById(id: string): Promise<Webhook | null> {
    return this.webhookRepository.findOne({
      where: { id },
      relations: ['project', 'createdBy'],
    });
  }

  async findByProject(projectId: string): Promise<Webhook[]> {
    return this.webhookRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveByProjectAndEvent(projectId: string, event: WebhookEvent): Promise<Webhook[]> {
    return this.webhookRepository
      .createQueryBuilder('webhook')
      .where('webhook.projectId = :projectId', { projectId })
      .andWhere('webhook.status = :status', { status: WebhookStatus.ACTIVE })
      .andWhere(':event = ANY(webhook.events)', { event })
      .getMany();
  }

  async update(id: string, data: Partial<Webhook>): Promise<Webhook | null> {
    await this.webhookRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.webhookRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async incrementFailureCount(id: string): Promise<void> {
    await this.webhookRepository.increment({ id }, 'failureCount', 1);
  }

  async resetFailureCount(id: string): Promise<void> {
    await this.webhookRepository.update(id, {
      failureCount: 0,
      lastSuccessAt: new Date(),
    });
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    await this.webhookRepository.update(id, {
      status: WebhookStatus.FAILED,
      lastError: error,
    });
  }

  // Webhook Log methods
  async createLog(data: Partial<WebhookLog>): Promise<WebhookLog> {
    const log = this.webhookLogRepository.create(data);
    return this.webhookLogRepository.save(log);
  }

  async updateLog(id: string, data: Partial<WebhookLog>): Promise<void> {
    await this.webhookLogRepository.update(id, data);
  }

  async findLogsByWebhook(webhookId: string, limit = 50, offset = 0): Promise<WebhookLog[]> {
    return this.webhookLogRepository.find({
      where: { webhookId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findPendingRetries(): Promise<WebhookLog[]> {
    const now = new Date();
    return this.webhookLogRepository
      .createQueryBuilder('log')
      .innerJoinAndSelect('log.webhook', 'webhook')
      .where('log.status = :status', { status: WebhookDeliveryStatus.RETRYING })
      .andWhere('log.nextRetryAt <= :now', { now })
      .andWhere('webhook.status = :webhookStatus', { webhookStatus: WebhookStatus.ACTIVE })
      .getMany();
  }

  async countLogsByWebhook(webhookId: string): Promise<number> {
    return this.webhookLogRepository.count({ where: { webhookId } });
  }

  async deleteOldLogs(daysToKeep = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.webhookLogRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected ?? 0;
  }
}
