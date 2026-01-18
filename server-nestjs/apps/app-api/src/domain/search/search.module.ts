import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task, Project, WorkspaceMember, Comment, User } from '@app/entity/entities';
import { SearchController } from './controller/search.controller';
import { SearchService } from './service/search.service';
import { SearchRepository } from './repository/search.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Project, WorkspaceMember, Comment, User])],
  controllers: [SearchController],
  providers: [SearchService, SearchRepository],
})
export class SearchModule {}
