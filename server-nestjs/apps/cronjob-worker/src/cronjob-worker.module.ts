import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { RedisModule, EmailModule, BullQueueModule } from '@app/external-infra';
import { LoggerModule } from '@app/logger';
import {
  User,
  UserRefreshToken,
  Workspace,
  WorkspaceMember,
  Project,
  ProjectMember,
  Task,
  Comment,
  FileMetadata,
  Webhook,
  WebhookLog,
  Role,
  Permission,
} from '@app/entity';

import { TaskReminderModule } from './task-reminder/task-reminder.module';
import { BloomFilterRebuildModule } from './bloom-filter-rebuild/bloom-filter-rebuild.module';
import { WebhookRetryModule } from './webhook-retry/webhook-retry.module';
import { RecurringTaskGeneratorModule } from './recurring-task-generator/recurring-task-generator.module';
import { RecurringTask } from '@app/entity/entities/recurring-task.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'project_management'),
        entities: [
          User,
          UserRefreshToken,
          Workspace,
          WorkspaceMember,
          Project,
          ProjectMember,
          Task,
          Comment,
          FileMetadata,
          Webhook,
          WebhookLog,
          RecurringTask,
          Role,
          Permission,
        ],
        synchronize: configService.get<string>('TYPEORM_SYNCHRONIZE') === 'true',
        extra: {
          max: configService.get<number>('DB_POOL_MAX', 20),
          min: configService.get<number>('DB_POOL_MIN', 5),
          idleTimeoutMillis: configService.get<number>('DB_IDLE_TIMEOUT', 30000),
          connectionTimeoutMillis: configService.get<number>('DB_CONNECTION_TIMEOUT', 5000),
        },
      }),
      inject: [ConfigService],
    }),

    ScheduleModule.forRoot(),

    LoggerModule,
    RedisModule,
    EmailModule,
    BullQueueModule,

    TaskReminderModule,
    BloomFilterRebuildModule,
    WebhookRetryModule,
    RecurringTaskGeneratorModule,
  ],
})
export class CronjobWorkerModule {}
