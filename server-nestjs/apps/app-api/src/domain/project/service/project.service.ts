import { Injectable, NotFoundException, ForbiddenException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { WebSocketService, BloomFilterService, RedisCacheService, CACHE_TTL } from '@app/external-infra';
import { ProjectRepository } from '../repository/project.repository';
import { CreateProjectDto, UpdateProjectDto, AddProjectMemberDto } from '../dto';

const BLOOM_FILTER_NAME = 'projects';
const CACHE_PREFIX = 'project';
const WORKSPACE_CACHE_PREFIX = 'user:workspaces';

@Injectable()
export class ProjectService implements OnModuleInit {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly webSocketService: WebSocketService,
    private readonly bloomFilter: BloomFilterService,
    private readonly cacheService: RedisCacheService,
  ) {}

  private async invalidateWorkspaceMembersCache(workspaceId: string) {
    const members = await this.projectRepository.getWorkspaceMembers(workspaceId);
    for (const member of members) {
      const cacheKey = this.cacheService.buildKey(WORKSPACE_CACHE_PREFIX, member.userId);
      await this.cacheService.del(cacheKey);
    }
  }

  async onModuleInit() {
    await this.initBloomFilter();
  }

  private async initBloomFilter() {
    const projects = await this.projectRepository.findAll();
    if (projects.length > 0) {
      const projectIds = projects.map((p) => p.id);
      await this.bloomFilter.addMany(BLOOM_FILTER_NAME, projectIds);
      console.log(`Bloom Filter initialized with ${projectIds.length} projects`);
    }
  }

  async createProject(userId: string, dto: CreateProjectDto) {
    const isAdmin = await this.projectRepository.isWorkspaceAdmin(dto.workspaceId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only workspace admin can create projects');
    }

    let teamLeadId: string = userId; 
    if (dto.teamLeadEmail) {
      const teamLead = await this.projectRepository.findUserByEmail(dto.teamLeadEmail);
      if (teamLead) {
        teamLeadId = teamLead.id;
      }
    }

    const project = await this.projectRepository.create({
      name: dto.name,
      description: dto.description,
      priority: dto.priority,
      status: dto.status,
      startDate: dto.startDate,
      endDate: dto.endDate,
      workspaceId: dto.workspaceId,
      teamLead: teamLeadId,
      progress: dto.progress ?? 0,
    });

    if (teamLeadId) {
      await this.projectRepository.addMember(project.id, teamLeadId);
    }

    if (dto.teamMembers?.length) {
      const workspaceMembers = await this.projectRepository.getWorkspaceMembers(dto.workspaceId);
      const membersToAdd: string[] = [];

      for (const workspaceMember of workspaceMembers) {
        if (dto.teamMembers.includes(workspaceMember.user.email)) {
          membersToAdd.push(workspaceMember.userId);
        }
      }

      for (const memberId of membersToAdd) {
        if (memberId !== teamLeadId) {
          const existingMember = await this.projectRepository.findMember(project.id, memberId);
          if (!existingMember) {
            await this.projectRepository.addMember(project.id, memberId);
          }
        }
      }
    }

    const projectWithMembers = await this.projectRepository.findById(project.id);

    await this.bloomFilter.add(BLOOM_FILTER_NAME, project.id);

    // Invalidate workspace cache so all members see the new project
    await this.invalidateWorkspaceMembersCache(dto.workspaceId);

    this.webSocketService.emitProjectCreated({
      project: projectWithMembers,
      workspaceId: dto.workspaceId,
    });

    return { project: projectWithMembers, message: 'Project created successfully' };
  }

  async getProjectById(projectId: string) {
    const mayExist = await this.bloomFilter.exists(BLOOM_FILTER_NAME, projectId);
    if (!mayExist) {
      return null;
    }

    const cacheKey = this.cacheService.buildKey(CACHE_PREFIX, projectId);
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.projectRepository.findById(projectId),
      CACHE_TTL.MEDIUM,
    );
  }

  async updateProject(userId: string, projectId: string, dto: UpdateProjectDto) {
    const mayExist = await this.bloomFilter.exists(BLOOM_FILTER_NAME, projectId);
    if (!mayExist) {
      throw new NotFoundException('Project not found');
    }

    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isAdmin = await this.projectRepository.isWorkspaceAdmin(project.workspaceId, userId);
    if (!isAdmin && project.teamLead !== userId) {
      throw new ForbiddenException('Only workspace admin or team lead can update project');
    }

    const updateData: any = { ...dto };
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);
    await this.projectRepository.update(projectId, updateData);
    const updatedProject = await this.projectRepository.findById(projectId);

    const cacheKey = this.cacheService.buildKey(CACHE_PREFIX, projectId);
    await this.cacheService.del(cacheKey);

    // Invalidate workspace cache so all members see project updates
    await this.invalidateWorkspaceMembersCache(project.workspaceId);

    this.webSocketService.emitProjectUpdated({
      project: updatedProject,
      workspaceId: project.workspaceId,
    });

    return { project: updatedProject, message: 'Project updated successfully' };
  }

  async deleteProject(userId: string, projectId: string) {
    const mayExist = await this.bloomFilter.exists(BLOOM_FILTER_NAME, projectId);
    if (!mayExist) {
      throw new NotFoundException('Project not found');
    }

    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isAdmin = await this.projectRepository.isWorkspaceAdmin(project.workspaceId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only workspace admin can delete project');
    }

    const workspaceId = project.workspaceId;

    // Invalidate workspace cache before deleting so all members see the removal
    await this.invalidateWorkspaceMembersCache(workspaceId);

    await this.projectRepository.delete(projectId);

    const cacheKey = this.cacheService.buildKey(CACHE_PREFIX, projectId);
    await this.cacheService.del(cacheKey);

    this.webSocketService.emitProjectDeleted({
      projectId,
      workspaceId,
    });

    return { message: 'Project deleted successfully' };
  }

  async addMember(userId: string, projectId: string, dto: AddProjectMemberDto) {
    const mayExist = await this.bloomFilter.exists(BLOOM_FILTER_NAME, projectId);
    if (!mayExist) {
      throw new NotFoundException('Project not found');
    }

    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isAdmin = await this.projectRepository.isWorkspaceAdmin(project.workspaceId, userId);
    if (!isAdmin && project.teamLead !== userId) {
      throw new ForbiddenException('Only workspace admin or team lead can add project members');
    }

    const user = await this.projectRepository.findUserByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingMember = await this.projectRepository.findMember(projectId, user.id);
    if (existingMember) {
      throw new BadRequestException('User is already a project member');
    }

    const member = await this.projectRepository.addMember(projectId, user.id);

    // Invalidate workspace cache for all members so they see updated project members list
    await this.invalidateWorkspaceMembersCache(project.workspaceId);

    this.webSocketService.emitProjectMemberAdded({
      projectId,
      workspaceId: project.workspaceId,
      member: {
        ...member,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    });

    return { member, message: 'Member added successfully' };
  }
}
