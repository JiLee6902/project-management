import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ProjectRepository } from '../repository/project.repository';
import { CreateProjectDto, UpdateProjectDto, AddProjectMemberDto } from '../dto';

@Injectable()
export class ProjectService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async createProject(userId: string, dto: CreateProjectDto) {
    // Check if user is workspace admin
    const isAdmin = await this.projectRepository.isWorkspaceAdmin(dto.workspaceId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only workspace admin can create projects');
    }

    // Resolve team lead by email if provided (like Express - allows null if not found)
    let teamLeadId: string | null = null;
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

    // Add team lead as project member (only if team lead exists)
    if (teamLeadId) {
      await this.projectRepository.addMember(project.id, teamLeadId);
    }

    // Add members from teamMembers (array of emails) - filter from workspace members
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
    return { project: projectWithMembers, message: 'Project created successfully' };
  }

  async updateProject(userId: string, projectId: string, dto: UpdateProjectDto) {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check authorization: workspace admin or team lead
    const isAdmin = await this.projectRepository.isWorkspaceAdmin(project.workspaceId, userId);
    if (!isAdmin && project.teamLead !== userId) {
      throw new ForbiddenException('Only workspace admin or team lead can update project');
    }

    await this.projectRepository.update(projectId, dto);
    const updatedProject = await this.projectRepository.findById(projectId);
    return { project: updatedProject, message: 'Project updated successfully' };
  }

  async deleteProject(userId: string, projectId: string) {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isAdmin = await this.projectRepository.isWorkspaceAdmin(project.workspaceId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only workspace admin can delete project');
    }

    await this.projectRepository.delete(projectId);
    return { message: 'Project deleted successfully' };
  }

  async addMember(userId: string, projectId: string, dto: AddProjectMemberDto) {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Only team lead can add members
    if (project.teamLead !== userId) {
      throw new ForbiddenException('Only team lead can add project members');
    }

    // Check if user exists
    const user = await this.projectRepository.findUserByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already a member
    const existingMember = await this.projectRepository.findMember(projectId, user.id);
    if (existingMember) {
      throw new BadRequestException('User is already a project member');
    }

    const member = await this.projectRepository.addMember(projectId, user.id);
    return { member, message: 'Member added successfully' };
  }
}
