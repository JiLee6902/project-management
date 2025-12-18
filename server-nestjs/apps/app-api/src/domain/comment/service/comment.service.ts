import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommentRepository } from '../repository/comment.repository';
import { CreateCommentDto } from '../dto';

@Injectable()
export class CommentService {
  constructor(private readonly commentRepository: CommentRepository) {}

  async getTaskComments(taskId: string) {
    const task = await this.commentRepository.findTask(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const comments = await this.commentRepository.findByTask(taskId);
    return { comments };
  }

  async addComment(userId: string, dto: CreateCommentDto) {
    const task = await this.commentRepository.findTask(dto.taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user is project member
    const member = await this.commentRepository.findProjectMember(task.projectId, userId);
    if (!member) {
      throw new ForbiddenException('Only project members can add comments');
    }

    const comment = await this.commentRepository.create({
      content: dto.content,
      userId,
      taskId: dto.taskId,
    });

    return { comment };
  }
}
