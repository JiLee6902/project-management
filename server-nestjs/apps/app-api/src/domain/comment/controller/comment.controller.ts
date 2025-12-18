import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Public } from '../../auth/guard/jwt-auth.guard';
import { User, CurrentUser } from '@app/shared-libs';
import { CommentService } from '../service/comment.service';
import { CreateCommentDto } from '../dto';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get(':taskId')
  @Public()
  async getTaskComments(@Param('taskId') taskId: string) {
    return this.commentService.getTaskComments(taskId);
  }

  @Post()
  async addComment(
    @User() user: CurrentUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentService.addComment(user.id, dto);
  }
}
