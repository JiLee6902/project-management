import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { EmailModule } from '@app/external-infra';
import { LoggerModule } from '@app/logger';

import { NotificationKafkaConsumer } from './kafka/notification-kafka.consumer';
import { NotificationService } from './service/notification.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule,
    EmailModule,
  ],
  providers: [
    {
      provide: 'KAFKA_CONFIG',
      useFactory: (configService: ConfigService) => ({
        brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
        clientId: configService.get<string>('KAFKA_CLIENT_ID', 'project-management-notification'),
        consumerGroup: configService.get<string>('KAFKA_CONSUMER_GROUP', 'project-management-group'),
        topicNotifications: configService.get<string>('KAFKA_TOPIC_NOTIFICATIONS', 'notifications'),
      }),
      inject: [ConfigService],
    },
    NotificationKafkaConsumer,
    NotificationService,
  ],
})
export class NotificationModule implements OnModuleInit {
  constructor(private readonly kafkaConsumer: NotificationKafkaConsumer) {}

  async onModuleInit() {
    await this.kafkaConsumer.connect();
  }
}
