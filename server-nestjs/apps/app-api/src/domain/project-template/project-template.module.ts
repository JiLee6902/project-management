import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectTemplate, Project, Task, Subtask } from '@app/entity/entities';
import { ProjectTemplateController } from './controller/project-template.controller';
import { ProjectTemplateService } from './service/project-template.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectTemplate, Project, Task, Subtask])],
  controllers: [ProjectTemplateController],
  providers: [ProjectTemplateService],
  exports: [ProjectTemplateService],
})
export class ProjectTemplateModule {}
