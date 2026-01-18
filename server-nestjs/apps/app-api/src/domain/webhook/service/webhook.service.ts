import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom, timeout, catchError, Observable } from 'rxjs';
import * as crypto from 'crypto';
import {
  Webhook,
  WebhookEvent,
  WebhookStatus,
  WebhookLog,
  WebhookDeliveryStatus,
} from '@app/entity/entities';
import { WebhookRepository } from '../repository/webhook.repository';
import { CreateWebhookDto, UpdateWebhookDto, WebhookTestResponseDto } from '../dto';

const MAX_RETRIES = 5;
const MAX_FAILURES_BEFORE_DISABLE = 10;
const RETRY_DELAYS = [60, 300, 900, 3600, 7200]; // seconds: 1min, 5min, 15min, 1hr, 2hr

@Injectable()
export class WebhookService {
  constructor(
    private readonly webhookRepository: WebhookRepository,
    private readonly httpService: HttpService,
  ) {}

  async create(projectId: string, userId: string, dto: CreateWebhookDto): Promise<Webhook> {
    const webhook = await this.webhookRepository.create({
      projectId,
      createdById: userId,
      name: dto.name,
      url: dto.url,
      secret: dto.secret,
      events: dto.events,
      status: WebhookStatus.ACTIVE,
    });

    return webhook;
  }

  async findById(id: string): Promise<Webhook> {
    const webhook = await this.webhookRepository.findById(id);
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    return webhook;
  }

  async findByProject(projectId: string): Promise<Webhook[]> {
    return this.webhookRepository.findByProject(projectId);
  }

  async update(id: string, dto: UpdateWebhookDto): Promise<Webhook> {
    const webhook = await this.findById(id);

    const updateData: Partial<Webhook> = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.url) updateData.url = dto.url;
    if (dto.secret !== undefined) updateData.secret = dto.secret;
    if (dto.events) updateData.events = dto.events;
    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === WebhookStatus.ACTIVE) {
        updateData.failureCount = 0;
        updateData.lastError = undefined;
      }
    }

    const updated = await this.webhookRepository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException('Webhook not found');
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.webhookRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Webhook not found');
    }
  }

  async testWebhook(id: string): Promise<WebhookTestResponseDto> {
    const webhook = await this.findById(id);

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhookId: webhook.id,
        webhookName: webhook.name,
      },
    };

    try {
      const startTime = Date.now();
      const signature = this.generateSignature(testPayload, webhook.secret);

      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(webhook.url, testPayload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': 'webhook.test',
          },
          timeout: 10000,
        }).pipe(
          timeout(10000),
          catchError((error) => {
            throw error;
          }),
        ),
      );

      return {
        success: true,
        statusCode: response.status,
        responseTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        statusCode: error.response?.status,
        error: error.message || 'Failed to deliver webhook',
      };
    }
  }

  async triggerWebhooks(
    projectId: string,
    event: WebhookEvent,
    payload: Record<string, any>,
  ): Promise<void> {
    const webhooks = await this.webhookRepository.findActiveByProjectAndEvent(projectId, event);

    for (const webhook of webhooks) {
      await this.deliverWebhook(webhook, event, payload);
    }
  }

  async deliverWebhook(
    webhook: Webhook,
    event: WebhookEvent,
    payload: Record<string, any>,
  ): Promise<void> {
    const fullPayload = {
      event,
      timestamp: new Date().toISOString(),
      webhookId: webhook.id,
      projectId: webhook.projectId,
      data: payload,
    };

    const log = await this.webhookRepository.createLog({
      webhookId: webhook.id,
      event,
      payload: fullPayload,
      status: WebhookDeliveryStatus.PENDING,
      attemptCount: 0,
    });

    await this.attemptDelivery(webhook, log, fullPayload);
  }

  private async attemptDelivery(
    webhook: Webhook,
    log: WebhookLog,
    payload: Record<string, any>,
  ): Promise<void> {
    const startTime = Date.now();
    const signature = this.generateSignature(payload, webhook.secret);

    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(webhook.url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': log.event,
            'X-Webhook-Delivery': log.id,
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
      await this.webhookRepository.updateLog(log.id, {
        status: WebhookDeliveryStatus.SUCCESS,
        responseStatus: response.status,
        responseBody: typeof response.data === 'string'
          ? response.data.substring(0, 1000)
          : JSON.stringify(response.data).substring(0, 1000),
        attemptCount: log.attemptCount + 1,
        durationMs: Date.now() - startTime,
      });

      await this.webhookRepository.resetFailureCount(webhook.id);
      await this.webhookRepository.update(webhook.id, {
        lastTriggeredAt: new Date(),
        lastSuccessAt: new Date(),
      });
    } catch (error: any) {
      const attemptCount = log.attemptCount + 1;
      const shouldRetry = attemptCount < MAX_RETRIES;

      await this.webhookRepository.updateLog(log.id, {
        status: shouldRetry ? WebhookDeliveryStatus.RETRYING : WebhookDeliveryStatus.FAILED,
        responseStatus: error.response?.status,
        errorMessage: error.message || 'Unknown error',
        attemptCount,
        durationMs: Date.now() - startTime,
        nextRetryAt: shouldRetry
          ? new Date(Date.now() + RETRY_DELAYS[attemptCount - 1] * 1000)
          : undefined,
      });

      await this.webhookRepository.incrementFailureCount(webhook.id);
      await this.webhookRepository.update(webhook.id, {
        lastTriggeredAt: new Date(),
        lastError: error.message,
      });

      // Disable webhook if too many failures
      const updatedWebhook = await this.webhookRepository.findById(webhook.id);
      if (updatedWebhook && updatedWebhook.failureCount >= MAX_FAILURES_BEFORE_DISABLE) {
        await this.webhookRepository.markAsFailed(
          webhook.id,
          `Disabled after ${MAX_FAILURES_BEFORE_DISABLE} consecutive failures`,
        );
      }
    }
  }

  async processRetries(): Promise<number> {
    const pendingRetries = await this.webhookRepository.findPendingRetries();
    let processed = 0;

    for (const log of pendingRetries) {
      if (log.webhook) {
        await this.attemptDelivery(log.webhook, log, log.payload);
        processed++;
      }
    }

    return processed;
  }

  async getWebhookLogs(webhookId: string, limit = 50, offset = 0): Promise<{
    logs: WebhookLog[];
    total: number;
  }> {
    const [logs, total] = await Promise.all([
      this.webhookRepository.findLogsByWebhook(webhookId, limit, offset),
      this.webhookRepository.countLogsByWebhook(webhookId),
    ]);

    return { logs, total };
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

  // Utility method to verify signature (for documentation/reference)
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(JSON.parse(payload), secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }
}
