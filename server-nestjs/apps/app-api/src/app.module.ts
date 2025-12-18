import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Libs
import { RedisModule, KafkaModule, EmailModule } from '@app/external-infra';
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

// Domain modules
import { AuthModule } from './domain/auth/auth.module';
import { UserModule } from './domain/user/user.module';
import { WorkspaceModule } from './domain/workspace/workspace.module';
import { ProjectModule } from './domain/project/project.module';
import { TaskModule } from './domain/task/task.module';
import { CommentModule } from './domain/comment/comment.module';
import { UploadModule } from './domain/upload/upload.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

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
        ],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Infrastructure
    LoggerModule,
    RedisModule,
    KafkaModule,
    EmailModule,

    // Domain modules
    AuthModule,
    UserModule,
    WorkspaceModule,
    ProjectModule,
    TaskModule,
    CommentModule,
    UploadModule,
  ],
})
export class AppModule {}
