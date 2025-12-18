import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment, Task, ProjectMember } from '@app/entity/entities';
import { CommentController } from './controller/comment.controller';
import { CommentService } from './service/comment.service';
import { CommentRepository } from './repository/comment.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Task, ProjectMember])],
  controllers: [CommentController],
  providers: [CommentService, CommentRepository],
  exports: [CommentService],
})
export class CommentModule {}
