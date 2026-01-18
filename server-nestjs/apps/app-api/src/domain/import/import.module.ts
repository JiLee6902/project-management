import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Task, Project, Label, WorkspaceMember } from '@app/entity/entities';
import { ImportController } from './controller/import.controller';
import { ImportService } from './service/import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Project, Label, WorkspaceMember]),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  ],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
