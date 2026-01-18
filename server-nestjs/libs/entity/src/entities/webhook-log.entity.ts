import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Webhook, WebhookEvent } from './webhook.entity';

export enum WebhookDeliveryStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

@Entity('webhook_logs')
export class WebhookLog extends BaseEntity {
  @Column({ name: 'webhook_id' })
  @Index()
  webhookId: string;

  @Column({
    type: 'enum',
    enum: WebhookEvent,
  })
  event: WebhookEvent;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({
    type: 'enum',
    enum: WebhookDeliveryStatus,
    default: WebhookDeliveryStatus.PENDING,
  })
  status: WebhookDeliveryStatus;

  @Column({ type: 'int', name: 'response_status', nullable: true })
  responseStatus?: number;

  @Column({ type: 'text', name: 'response_body', nullable: true })
  responseBody?: string;

  @Column({ type: 'int', name: 'attempt_count', default: 0 })
  attemptCount: number;

  @Column({ type: 'timestamp', name: 'next_retry_at', nullable: true })
  nextRetryAt?: Date;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage?: string;

  @Column({ type: 'int', name: 'duration_ms', nullable: true })
  durationMs?: number;

  // Relations
  @ManyToOne(() => Webhook, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'webhook_id' })
  webhook: Webhook;
}
