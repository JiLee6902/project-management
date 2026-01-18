import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Webhook, WebhookLog } from '@app/entity/entities';
import { WebhookRetryService } from './webhook-retry.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Webhook, WebhookLog]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  providers: [WebhookRetryService],
})
export class WebhookRetryModule {}
