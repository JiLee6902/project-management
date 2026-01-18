import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookStatus } from '@app/entity/entities';
import { CreateWebhookDto } from './create-webhook.dto';

export class UpdateWebhookDto extends PartialType(CreateWebhookDto) {
  @ApiPropertyOptional({ enum: WebhookStatus })
  @IsOptional()
  @IsEnum(WebhookStatus)
  status?: WebhookStatus;
}
