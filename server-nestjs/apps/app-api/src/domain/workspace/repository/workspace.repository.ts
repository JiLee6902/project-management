import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace, WorkspaceMember, WorkspaceRole, User } from '@app/entity/entities';

@Injectable()
export class WorkspaceRepository {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findUserWorkspaces(userId: string): Promise<Workspace[]> {
    return this.workspaceRepository
      .createQueryBuilder('workspace')
      .innerJoin('workspace.members', 'member', 'member.userId = :userId', { userId })
      .leftJoinAndSelect('workspace.members', 'allMembers')
      .leftJoinAndSelect('allMembers.user', 'memberUser')
      .leftJoinAndSelect('workspace.projects', 'projects')
      .leftJoinAndSelect('projects.members', 'projectMembers')
      .leftJoinAndSelect('projectMembers.user', 'projectMemberUser')
      .leftJoinAndSelect('projects.tasks', 'tasks')
      .leftJoinAndSelect('tasks.assignee', 'assignee')
      .leftJoinAndSelect('tasks.comments', 'comments')
      .leftJoinAndSelect('comments.user', 'commentUser')
      .leftJoinAndSelect('workspace.owner', 'owner')
      .getMany();
  }

  async findById(id: string): Promise<Workspace | null> {
    return this.workspaceRepository.findOne({
      where: { id },
      relations: ['members', 'members.user', 'projects', 'owner'],
    });
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    return this.workspaceRepository.findOne({ where: { slug } });
  }

  async findByNameAndOwner(name: string, ownerId: string): Promise<Workspace | null> {
    return this.workspaceRepository.findOne({ where: { name, ownerId } });
  }

  async create(data: Partial<Workspace>): Promise<Workspace> {
    const workspace = this.workspaceRepository.create(data);
    return this.workspaceRepository.save(workspace);
  }

  async update(id: string, data: Partial<Workspace>): Promise<void> {
    await this.workspaceRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.workspaceRepository.softDelete(id);
  }

  async addMember(workspaceId: string, userId: string, role: WorkspaceRole, message?: string): Promise<WorkspaceMember> {
    const member = this.memberRepository.create({
      workspaceId,
      userId,
      role,
      message: message || '',
    });
    return this.memberRepository.save(member);
  }

  async findMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    return this.memberRepository.findOne({
      where: { workspaceId, userId },
    });
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await this.memberRepository.delete({ workspaceId, userId });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
}
