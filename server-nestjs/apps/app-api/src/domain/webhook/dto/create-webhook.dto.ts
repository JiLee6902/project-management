import { IsString, IsUrl, IsArray, IsEnum, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookEvent } from '@app/entity/entities';

export class CreateWebhookDto {
  @ApiProperty({ description: 'Webhook name' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Webhook URL endpoint' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url: string;

  @ApiPropertyOptional({ description: 'Secret for HMAC signature verification' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  secret?: string;

  @ApiProperty({
    description: 'Events to subscribe to',
    enum: WebhookEvent,
    isArray: true,
    example: ['task.created', 'task.updated'],
  })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];
}
