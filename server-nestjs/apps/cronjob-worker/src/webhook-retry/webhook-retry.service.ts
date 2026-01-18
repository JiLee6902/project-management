import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import * as crypto from 'crypto';
import {
  Webhook,
  WebhookLog,
  WebhookStatus,
  WebhookDeliveryStatus,
} from '@app/entity/entities';

const MAX_RETRIES = 5;
const MAX_FAILURES_BEFORE_DISABLE = 10;
const RETRY_DELAYS = [60, 300, 900, 3600, 7200]; // seconds

@Injectable()
export class WebhookRetryService {
  private readonly logger = new Logger(WebhookRetryService.name);

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookLog)
    private readonly webhookLogRepository: Repository<WebhookLog>,
    private readonly httpService: HttpService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processWebhookRetries(): Promise<void> {
    this.logger.log('Processing webhook retries...');

    const now = new Date();
    const pendingRetries = await this.webhookLogRepository
      .createQueryBuilder('log')
      .innerJoinAndSelect('log.webhook', 'webhook')
      .where('log.status = :status', { status: WebhookDeliveryStatus.RETRYING })
      .andWhere('log.nextRetryAt <= :now', { now })
      .andWhere('webhook.status = :webhookStatus', { webhookStatus: WebhookStatus.ACTIVE })
      .take(100) // Process max 100 retries per minute
      .getMany();

    this.logger.log(`Found ${pendingRetries.length} pending webhook retries`);

    let successCount = 0;
    let failureCount = 0;

    for (const log of pendingRetries) {
      try {
        await this.attemptDelivery(log);
        successCount++;
      } catch (error) {
        failureCount++;
        this.logger.error(`Failed to process webhook retry ${log.id}`, error);
      }
    }

    this.logger.log(`Webhook retries processed: ${successCount} success, ${failureCount} failed`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldLogs(): Promise<void> {
    this.logger.log('Cleaning up old webhook logs...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const result = await this.webhookLogRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`Deleted ${result.affected} old webhook logs`);
  }

  private async attemptDelivery(log: WebhookLog): Promise<void> {
    const webhook = log.webhook;
    if (!webhook) {
      this.logger.warn(`Webhook not found for log ${log.id}`);
      return;
    }

    const startTime = Date.now();
    const signature = this.generateSignature(log.payload, webhook.secret);

    try {
      const response = await firstValueFrom(
        this.httpService.post(webhook.url, log.payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': log.event,
            'X-Webhook-Delivery': log.id,
            'X-Webhook-Retry': String(log.attemptCount),
          },
          timeout: 30000,
        }).pipe(
          timeout(30000),
          catchError((error) => {
            throw error;
          }),
        ),
      );

      // Success
      await this.webhookLogRepository.update(log.id, {
        status: WebhookDeliveryStatus.SUCCESS,
        responseStatus: response.status,
        responseBody: typeof response.data === 'string'
          ? response.data.substring(0, 1000)
          : JSON.stringify(response.data).substring(0, 1000),
        attemptCount: log.attemptCount + 1,
        durationMs: Date.now() - startTime,
        nextRetryAt: undefined,
      });

      await this.webhookRepository.update(webhook.id, {
        failureCount: 0,
        lastSuccessAt: new Date(),
      });

      this.logger.log(`Webhook delivery successful for log ${log.id}`);
    } catch (error: any) {
      const attemptCount = log.attemptCount + 1;
      const shouldRetry = attemptCount < MAX_RETRIES;

      await this.webhookLogRepository.update(log.id, {
        status: shouldRetry ? WebhookDeliveryStatus.RETRYING : WebhookDeliveryStatus.FAILED,
        responseStatus: error.response?.status,
        errorMessage: error.message || 'Unknown error',
        attemptCount,
        durationMs: Date.now() - startTime,
        nextRetryAt: shouldRetry
          ? new Date(Date.now() + RETRY_DELAYS[attemptCount - 1] * 1000)
          : undefined,
      });

      await this.webhookRepository.increment({ id: webhook.id }, 'failureCount', 1);

      // Check if we should disable the webhook
      const updatedWebhook = await this.webhookRepository.findOne({ where: { id: webhook.id } });
      if (updatedWebhook && updatedWebhook.failureCount >= MAX_FAILURES_BEFORE_DISABLE) {
        await this.webhookRepository.update(webhook.id, {
          status: WebhookStatus.FAILED,
          lastError: `Disabled after ${MAX_FAILURES_BEFORE_DISABLE} consecutive failures`,
        });
        this.logger.warn(`Webhook ${webhook.id} disabled due to too many failures`);
      }

      this.logger.warn(
        `Webhook delivery failed for log ${log.id}, attempt ${attemptCount}/${MAX_RETRIES}`,
      );
    }
  }

  private generateSignature(payload: Record<string, any>, secret?: string): string {
    if (!secret) {
      return '';
    }

    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString);
    return `sha256=${hmac.digest('hex')}`;
  }
}
