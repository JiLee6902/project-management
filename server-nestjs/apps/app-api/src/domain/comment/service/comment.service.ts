import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { WebSocketService } from '@app/external-infra';
import { CommentRepository } from '../repository/comment.repository';
import { CreateCommentDto } from '../dto';
import { ActivityService } from '../../activity/service/activity.service';
import { NotificationService } from '../../notification/service/notification.service';
import { ActivityType, NotificationType } from '@app/entity/entities';
import { extractMentions } from '@app/shared-libs';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly webSocketService: WebSocketService,
    private readonly activityService: ActivityService,
    private readonly notificationService: NotificationService,
  ) {}

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

    // Check if user is project member or workspace member
    const project = await this.commentRepository.findProject(task.projectId);
    const projectMember = await this.commentRepository.findProjectMember(task.projectId, userId);
    const workspaceMember = project?.workspaceId
      ? await this.commentRepository.findWorkspaceMember(project.workspaceId, userId)
      : null;

    if (!projectMember && !workspaceMember) {
      throw new ForbiddenException('Only workspace or project members can add comments');
    }

    const comment = await this.commentRepository.create({
      content: dto.content,
      userId,
      taskId: dto.taskId,
    });

    const commentWithUser = await this.commentRepository.findById(comment.id);

    this.webSocketService.emitCommentAdded({
      comment: commentWithUser,
      taskId: dto.taskId,
      projectId: task.projectId,
      workspaceId: project?.workspaceId,
    });

    await this.activityService.logActivity(
      userId,
      task.projectId,
      ActivityType.COMMENT_ADDED,
      {
        taskId: dto.taskId,
        description: 'added a comment',
        metadata: { taskTitle: task.title, commentPreview: dto.content.substring(0, 100) },
      },
    );

    const mentions = extractMentions(dto.content);
    if (mentions.length > 0) {
      await this.processMentions(mentions, userId, task, project, dto.content);
    }

    return { comment: commentWithUser };
  }

  private async processMentions(
    mentionNames: string[],
    mentionerId: string,
    task: any,
    project: any,
    commentContent: string,
  ) {
    const mentionedUsers = await this.commentRepository.findUsersByNames(mentionNames);

    if (mentionedUsers.length === 0) return;

    const workspaceMembers = await this.commentRepository.findWorkspaceMembersByUserIds(
      project?.workspaceId,
      mentionedUsers.map(u => u.id),
    );

    const memberUserIds = new Set(workspaceMembers.map(m => m.userId));

    for (const user of mentionedUsers) {
      if (!memberUserIds.has(user.id)) continue;
      if (user.id === mentionerId) continue;

      await this.notificationService.createNotification({
        userId: user.id,
        type: NotificationType.MENTION,
        title: 'You were mentioned',
        message: `mentioned you in a comment on "${task.title}"`,
        data: {
          taskId: task.id,
          projectId: task.projectId,
          workspaceId: project?.workspaceId,
          commentPreview: commentContent.substring(0, 100),
        },
      });
    }
  }
}
