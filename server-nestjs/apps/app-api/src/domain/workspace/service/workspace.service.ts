import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { WorkspaceRole } from '@app/entity/entities';
import { WorkspaceRepository } from '../repository/workspace.repository';
import { CreateWorkspaceDto, UpdateWorkspaceDto, AddMemberDto } from '../dto';

@Injectable()
export class WorkspaceService {
  constructor(private readonly workspaceRepository: WorkspaceRepository) {}

  async getUserWorkspaces(userId: string) {
    const workspaces = await this.workspaceRepository.findUserWorkspaces(userId);
    return { workspaces };
  }

  async createWorkspace(userId: string, dto: CreateWorkspaceDto) {
    // Check slug uniqueness
    const existingWorkspace = await this.workspaceRepository.findBySlug(dto.slug);
    if (existingWorkspace) {
      throw new BadRequestException('Workspace slug already exists');
    }

    // Create workspace
    const workspace = await this.workspaceRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      ownerId: userId,
    });

    // Add creator as admin
    await this.workspaceRepository.addMember(workspace.id, userId, WorkspaceRole.ADMIN);

    return this.workspaceRepository.findById(workspace.id);
  }

  async updateWorkspace(userId: string, workspaceId: string, dto: UpdateWorkspaceDto) {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if user is admin
    const member = await this.workspaceRepository.findMember(workspaceId, userId);
    if (!member || member.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Only workspace admin can update workspace');
    }

    await this.workspaceRepository.update(workspaceId, dto);
    return this.workspaceRepository.findById(workspaceId);
  }

  async deleteWorkspace(userId: string, workspaceId: string) {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Only workspace owner can delete workspace');
    }

    await this.workspaceRepository.delete(workspaceId);
    return { message: 'Workspace deleted successfully' };
  }

  async addMember(userId: string, workspaceId: string, dto: AddMemberDto) {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if requester is admin
    const requesterMember = await this.workspaceRepository.findMember(workspaceId, userId);
    if (!requesterMember || requesterMember.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Only workspace admin can add members');
    }

    // Find user by email
    const user = await this.workspaceRepository.findUserByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const existingMember = await this.workspaceRepository.findMember(workspaceId, user.id);
    if (existingMember) {
      throw new BadRequestException('User is already a member of this workspace');
    }

    await this.workspaceRepository.addMember(workspaceId, user.id, dto.role || WorkspaceRole.MEMBER, dto.message);
    return this.workspaceRepository.findById(workspaceId);
  }

  async removeMember(userId: string, workspaceId: string, memberId: string) {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if requester is admin
    const requesterMember = await this.workspaceRepository.findMember(workspaceId, userId);
    if (!requesterMember || requesterMember.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Only workspace admin can remove members');
    }

    // Cannot remove owner
    if (memberId === workspace.ownerId) {
      throw new BadRequestException('Cannot remove workspace owner');
    }

    await this.workspaceRepository.removeMember(workspaceId, memberId);
    return { message: 'Member removed successfully' };
  }
}
