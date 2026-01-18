import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { RedisModule, EmailModule, WebSocketModule, BullQueueModule } from '@app/external-infra';
import { ThrottlerBehindProxyGuard } from '@app/shared-libs';
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
  Notification,
  Label,
  Subtask,
  Activity,
  TimeEntry,
  Sprint,
  TaskTemplate,
  SavedFilter,
  TaskAttachment,
  TaskDependency,
  TaskWatcher,
  CustomField,
  TaskCustomFieldValue,
  ProjectTemplate,
  AutomationRule,
  Webhook,
  WebhookLog,
  RecurringTask,
  AuditLog,
  Permission,
  Role,
} from '@app/entity';

import { AuthModule } from './domain/auth/auth.module';
import { UserModule } from './domain/user/user.module';
import { WorkspaceModule } from './domain/workspace/workspace.module';
import { ProjectModule } from './domain/project/project.module';
import { TaskModule } from './domain/task/task.module';
import { CommentModule } from './domain/comment/comment.module';
import { UploadModule } from './domain/upload/upload.module';
import { NotificationModule } from './domain/notification/notification.module';
import { SearchModule } from './domain/search/search.module';
import { LabelModule } from './domain/label/label.module';
import { ActivityModule } from './domain/activity/activity.module';
import { TimeTrackingModule } from './domain/time-tracking/time-tracking.module';
import { ExportModule } from './domain/export/export.module';
import { HealthModule } from './health/health.module';
import { SprintModule } from './domain/sprint/sprint.module';
import { TaskTemplateModule } from './domain/task-template/task-template.module';
import { AttachmentModule } from './domain/attachment/attachment.module';
import { SavedFilterModule } from './domain/saved-filter/saved-filter.module';
import { CustomFieldModule } from './domain/custom-field/custom-field.module';
import { ProjectTemplateModule } from './domain/project-template/project-template.module';
import { AutomationModule } from './domain/automation/automation.module';
import { ReportModule } from './domain/report/report.module';
import { WebhookModule } from './domain/webhook/webhook.module';
import { RecurringTaskModule } from './domain/recurring-task/recurring-task.module';
import { AuditLogModule } from './domain/audit-log/audit-log.module';
import { ImportModule } from './domain/import/import.module';
import { PermissionModule } from './domain/permission/permission.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, 
        limit: 10, 
      },
      {
        name: 'medium',
        ttl: 10000, 
        limit: 50,
      },
      {
        name: 'long',
        ttl: 60000, 
        limit: 200, 
      },
    ]),

    // Database
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
          Notification,
          Label,
          Subtask,
          Activity,
          TimeEntry,
          Sprint,
          TaskTemplate,
          SavedFilter,
          TaskAttachment,
          TaskDependency,
          TaskWatcher,
          CustomField,
          TaskCustomFieldValue,
          ProjectTemplate,
          AutomationRule,
          Webhook,
          WebhookLog,
          RecurringTask,
          AuditLog,
          Permission,
          Role,
        ],
        synchronize: configService.get<string>('TYPEORM_SYNCHRONIZE') === 'true' || configService.get<string>('NODE_ENV') === 'development',
        logging:
          configService.get<string>('NODE_ENV') === 'production'
            ? ['error', 'warn']
            : true,
        extra: {
          max: configService.get<number>('DB_POOL_MAX', 50),
          min: configService.get<number>('DB_POOL_MIN', 10),
          idleTimeoutMillis: configService.get<number>('DB_IDLE_TIMEOUT', 30000),
          connectionTimeoutMillis: configService.get<number>('DB_CONNECTION_TIMEOUT', 5000),
          statement_timeout: 30000,
        },
      }),
      inject: [ConfigService],
    }),

    LoggerModule,
    RedisModule,
    EmailModule,
    WebSocketModule,
    BullQueueModule,

    AuthModule,
    UserModule,
    WorkspaceModule,
    ProjectModule,
    TaskModule,
    CommentModule,
    UploadModule,
    NotificationModule,
    SearchModule,
    LabelModule,
    ActivityModule,
    TimeTrackingModule,
    ExportModule,
    HealthModule,
    SprintModule,
    TaskTemplateModule,
    AttachmentModule,
    SavedFilterModule,
    CustomFieldModule,
    ProjectTemplateModule,
    AutomationModule,
    ReportModule,
    WebhookModule,
    RecurringTaskModule,
    AuditLogModule,
    ImportModule,
    PermissionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
})
export class AppModule {}
