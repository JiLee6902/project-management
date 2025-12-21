import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { Comment, Task, ProjectMember, Project, User, WorkspaceMember } from '@app/entity/entities';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
  ) {}

  async findByTask(taskId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { taskId, parentId: null as any },
      relations: ['user', 'replies', 'replies.user'],
      order: { createdAt: 'ASC' },
    });
  }

  async findReplies(parentId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { parentId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async create(data: Partial<Comment>): Promise<Comment> {
    const comment = this.commentRepository.create(data);
    return this.commentRepository.save(comment);
  }

  async findById(id: string): Promise<Comment | null> {
    return this.commentRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findTask(taskId: string): Promise<Task | null> {
    return this.taskRepository.findOne({ where: { id: taskId } });
  }

  async findProjectMember(projectId: string, userId: string): Promise<ProjectMember | null> {
    return this.memberRepository.findOne({ where: { projectId, userId } });
  }

  async findProject(projectId: string): Promise<Project | null> {
    return this.projectRepository.findOne({ where: { id: projectId } });
  }

  async findWorkspaceMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    return this.workspaceMemberRepository.findOne({ where: { workspaceId, userId } });
  }

  async findUsersByNames(names: string[]): Promise<User[]> {
    if (!names || names.length === 0) return [];
    return this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.name) IN (:...names)', { names: names.map(n => n.toLowerCase()) })
      .getMany();
  }

  async findWorkspaceMembersByUserIds(workspaceId: string, userIds: string[]): Promise<WorkspaceMember[]> {
    if (!userIds || userIds.length === 0) return [];
    return this.workspaceMemberRepository.find({
      where: {
        workspaceId,
        userId: In(userIds),
      },
    });
  }
}
