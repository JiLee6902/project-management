import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { NotificationEventDto } from '../dto/notification-event.dto';

interface KafkaConfig {
  brokers: string[];
  clientId: string;
  consumerGroup: string;
  topicNotifications: string;
}

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  constructor(
    @Inject('KAFKA_CONFIG')
    private readonly config: KafkaConfig,
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

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      console.log('Kafka Producer connected');
    } catch (error) {
      console.error('Failed to connect Kafka Producer:', error);
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    console.log('Kafka Producer disconnected');
  }

  async sendNotification(event: NotificationEventDto): Promise<void> {
    try {
      await this.producer.send({
        topic: this.config.topicNotifications,
        messages: [
          {
            key: event.userId,
            value: JSON.stringify(event),
          },
        ],
      });
      console.log(`Notification sent to Kafka: ${event.type} for user ${event.userId}`);
    } catch (error) {
      console.error('Failed to send notification to Kafka:', error);
      throw error;
    }
  }

  async sendMessage(topic: string, key: string, value: any): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key,
            value: JSON.stringify(value),
          },
        ],
      });
    } catch (error) {
      console.error(`Failed to send message to topic ${topic}:`, error);
      throw error;
    }
  }
}
