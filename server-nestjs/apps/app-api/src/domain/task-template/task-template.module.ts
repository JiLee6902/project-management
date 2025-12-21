import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskTemplate, Workspace, WorkspaceMember } from '@app/entity/entities';
import { TaskTemplateController } from './task-template.controller';
import { TaskTemplateService } from './task-template.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskTemplate, Workspace, WorkspaceMember])],
  controllers: [TaskTemplateController],
  providers: [TaskTemplateService],
  exports: [TaskTemplateService],
})
export class TaskTemplateModule {}
