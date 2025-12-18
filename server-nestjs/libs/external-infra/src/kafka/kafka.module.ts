import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaProducerService } from './service/kafka-producer.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'KAFKA_CONFIG',
      useFactory: (configService: ConfigService) => ({
        brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
        clientId: configService.get<string>('KAFKA_CLIENT_ID', 'project-management'),
        consumerGroup: configService.get<string>('KAFKA_CONSUMER_GROUP', 'project-management-group'),
        topicNotifications: configService.get<string>('KAFKA_TOPIC_NOTIFICATIONS', 'notifications'),
      }),
      inject: [ConfigService],
    },
    KafkaProducerService,
  ],
  exports: [KafkaProducerService, 'KAFKA_CONFIG'],
})
export class KafkaModule {}
