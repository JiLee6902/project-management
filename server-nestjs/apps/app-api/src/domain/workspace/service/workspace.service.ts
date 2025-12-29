import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { WorkspaceRole } from '@app/entity/entities';
import { RedisCacheService, CACHE_TTL } from '@app/external-infra';
import { WorkspaceRepository } from '../repository/workspace.repository';
import { CreateWorkspaceDto, UpdateWorkspaceDto, AddMemberDto } from '../dto';

const CACHE_PREFIX = {
  USER_WORKSPACES: 'user:workspaces',
  WORKSPACE: 'workspace',
};

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly cacheService: RedisCacheService,
  ) {}

  async getUserWorkspaces(userId: string) {
    const cacheKey = this.cacheService.buildKey(CACHE_PREFIX.USER_WORKSPACES, userId);

    const workspaces = await this.cacheService.getOrSet(
      cacheKey,
      () => this.workspaceRepository.findUserWorkspaces(userId),
      CACHE_TTL.MEDIUM,
    );

    return { workspaces };
  }

  private async invalidateUserWorkspacesCache(userId: string) {
    const cacheKey = this.cacheService.buildKey(CACHE_PREFIX.USER_WORKSPACES, userId);
    await this.cacheService.del(cacheKey);
  }

  private async invalidateWorkspaceMembersCache(workspaceId: string) {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (workspace?.members) {
      for (const member of workspace.members) {
        await this.invalidateUserWorkspacesCache(member.userId);
      }
    }
  }

  async createWorkspace(userId: string, dto: CreateWorkspaceDto) {
    const existingWorkspace = await this.workspaceRepository.findBySlug(dto.slug);
    if (existingWorkspace) {
      throw new BadRequestException('Workspace slug already exists');
    }

    // Check for duplicate workspace name for the same owner
    const existingName = await this.workspaceRepository.findByNameAndOwner(dto.name, userId);
    if (existingName) {
      throw new BadRequestException('You already have a workspace with this name');
    }

    const workspace = await this.workspaceRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      ownerId: userId,
    });

    await this.workspaceRepository.addMember(workspace.id, userId, WorkspaceRole.ADMIN);

    await this.invalidateUserWorkspacesCache(userId);

    return this.workspaceRepository.findById(workspace.id);
  }

  async updateWorkspace(userId: string, workspaceId: string, dto: UpdateWorkspaceDto) {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const member = await this.workspaceRepository.findMember(workspaceId, userId);
    if (!member || member.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Only workspace admin can update workspace');
    }

    // Check for duplicate workspace name for the same owner when updating name
    if (dto.name && dto.name !== workspace.name) {
      const existingName = await this.workspaceRepository.findByNameAndOwner(dto.name, workspace.ownerId);
      if (existingName) {
        throw new BadRequestException('A workspace with this name already exists');
      }
    }

    await this.workspaceRepository.update(workspaceId, dto);

    await this.invalidateWorkspaceMembersCache(workspaceId);

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

    await this.invalidateWorkspaceMembersCache(workspaceId);

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

    await this.invalidateUserWorkspacesCache(user.id);

    return this.workspaceRepository.findById(workspaceId);
  }

  async removeMember(userId: string, workspaceId: string, memberId: string) {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const requesterMember = await this.workspaceRepository.findMember(workspaceId, userId);
    if (!requesterMember || requesterMember.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Only workspace admin can remove members');
    }

    if (memberId === workspace.ownerId) {
      throw new BadRequestException('Cannot remove workspace owner');
    }

    await this.invalidateUserWorkspacesCache(memberId);

    await this.workspaceRepository.removeMember(workspaceId, memberId);
    return { message: 'Member removed successfully' };
  }
}
