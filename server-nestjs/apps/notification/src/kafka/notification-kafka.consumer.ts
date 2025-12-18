import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { NotificationService } from '../service/notification.service';

interface KafkaConfig {
  brokers: string[];
  clientId: string;
  consumerGroup: string;
  topicNotifications: string;
}

@Injectable()
export class NotificationKafkaConsumer implements OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    @Inject('KAFKA_CONFIG')
    private readonly config: KafkaConfig,
    private readonly notificationService: NotificationService,
  ) {
    this.kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.brokers,
      retry: {
        retries: 5,
        initialRetryTime: 300,
        maxRetryTime: 30000,
      },
    });

    this.consumer = this.kafka.consumer({
      groupId: this.config.consumerGroup,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      console.log('Kafka Consumer connected');

      await this.consumer.subscribe({
        topic: this.config.topicNotifications,
        fromBeginning: false,
      });

      console.log(`Subscribed to topic: ${this.config.topicNotifications}`);

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      console.log('Kafka Consumer is running');
    } catch (error) {
      console.error('Failed to connect Kafka Consumer:', error);
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      const value = message.value?.toString();
      if (!value) {
        console.warn('Received empty message');
        return;
      }

      const notificationEvent = JSON.parse(value);

      console.log(`Received notification event:`, {
        topic,
        partition,
        offset: message.offset,
        type: notificationEvent.type,
        userId: notificationEvent.userId,
      });

      await this.notificationService.processNotification(notificationEvent);
    } catch (error) {
      console.error('Failed to process message:', error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
    console.log('Kafka Consumer disconnected');
  }
}
