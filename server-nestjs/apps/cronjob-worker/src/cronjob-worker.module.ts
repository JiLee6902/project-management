import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { RedisModule, EmailModule } from '@app/external-infra';
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
} from '@app/entity';

import { TaskReminderModule } from './task-reminder/task-reminder.module';

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
        ],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),

    ScheduleModule.forRoot(),

    LoggerModule,
    RedisModule,
    EmailModule,

    TaskReminderModule,
  ],
})
export class CronjobWorkerModule {}
