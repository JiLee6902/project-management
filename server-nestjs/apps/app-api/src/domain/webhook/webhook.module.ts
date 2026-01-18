import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Webhook, WebhookLog } from '@app/entity/entities';
import { WebhookController } from './controller/webhook.controller';
import { WebhookService } from './service/webhook.service';
import { WebhookRepository } from './repository/webhook.repository';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Webhook, WebhookLog]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookRepository],
  exports: [WebhookService],
})
export class WebhookModule {}
