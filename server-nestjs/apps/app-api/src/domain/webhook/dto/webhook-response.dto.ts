import { ApiProperty } from '@nestjs/swagger';
import { WebhookEvent, WebhookStatus, WebhookDeliveryStatus } from '@app/entity/entities';

export class WebhookResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ enum: WebhookStatus })
  status: WebhookStatus;

  @ApiProperty({ enum: WebhookEvent, isArray: true })
  events: WebhookEvent[];

  @ApiProperty()
  failureCount: number;

  @ApiProperty({ nullable: true })
  lastTriggeredAt?: Date;

  @ApiProperty({ nullable: true })
  lastSuccessAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class WebhookLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  webhookId: string;

  @ApiProperty({ enum: WebhookEvent })
  event: WebhookEvent;

  @ApiProperty()
  payload: Record<string, any>;

  @ApiProperty({ enum: WebhookDeliveryStatus })
  status: WebhookDeliveryStatus;

  @ApiProperty({ nullable: true })
  responseStatus?: number;

  @ApiProperty()
  attemptCount: number;

  @ApiProperty({ nullable: true })
  durationMs?: number;

  @ApiProperty({ nullable: true })
  errorMessage?: string;

  @ApiProperty()
  createdAt: Date;
}

export class WebhookTestResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ nullable: true })
  statusCode?: number;

  @ApiProperty({ nullable: true })
  responseTime?: number;

  @ApiProperty({ nullable: true })
  error?: string;
}
