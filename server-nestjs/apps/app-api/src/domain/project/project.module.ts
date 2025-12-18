import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project, ProjectMember, Workspace, WorkspaceMember, User } from '@app/entity/entities';
import { ProjectController } from './controller/project.controller';
import { ProjectService } from './service/project.service';
import { ProjectRepository } from './repository/project.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectMember, Workspace, WorkspaceMember, User])],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectRepository],
  exports: [ProjectService, ProjectRepository],
})
export class ProjectModule {}
