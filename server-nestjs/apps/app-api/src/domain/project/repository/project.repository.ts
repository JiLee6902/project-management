import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectMember, WorkspaceMember, User, WorkspaceRole } from '@app/entity/entities';

@Injectable()
export class ProjectRepository {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<Project | null> {
    return this.projectRepository.findOne({
      where: { id },
      relations: ['members', 'members.user', 'tasks', 'tasks.assignee', 'owner', 'workspace'],
    });
  }

  async create(data: Partial<Project>): Promise<Project> {
    const project = this.projectRepository.create(data);
    return this.projectRepository.save(project);
  }

  async update(id: string, data: Partial<Project>): Promise<void> {
    await this.projectRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.projectRepository.softDelete(id);
  }

  async addMember(projectId: string, userId: string): Promise<ProjectMember> {
    const member = this.memberRepository.create({ projectId, userId });
    return this.memberRepository.save(member);
  }

  async findMember(projectId: string, userId: string): Promise<ProjectMember | null> {
    return this.memberRepository.findOne({ where: { projectId, userId } });
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await this.memberRepository.delete({ projectId, userId });
  }

  async findWorkspaceMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    return this.workspaceMemberRepository.findOne({ where: { workspaceId, userId } });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async isWorkspaceAdmin(workspaceId: string, userId: string): Promise<boolean> {
    const member = await this.findWorkspaceMember(workspaceId, userId);
    return member?.role === WorkspaceRole.ADMIN;
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.workspaceMemberRepository.find({
      where: { workspaceId },
      relations: ['user'],
    });
  }
}
