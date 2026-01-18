import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Task,
  Project,
  WorkspaceMember,
  ProjectMember,
  Comment,
  Workspace,
} from '@app/entity/entities';
import { IPolicyService, PolicyContext } from '@app/shared-libs/guards/policy.guard';
import { PolicyType } from '@app/shared-libs/decorators/check-policy.decorator';

@Injectable()
export class PolicyService implements IPolicyService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
  ) {}

  /**
   * Evaluate a policy for a user
   */
  async evaluatePolicy(
    userId: string,
    policyType: PolicyType,
    context: PolicyContext,
  ): Promise<boolean> {
    switch (policyType) {
      case PolicyType.IS_OWNER:
        return this.isOwner(userId, context.resourceId);

      case PolicyType.IS_CREATOR:
        return this.isCreator(userId, context.resourceId);

      case PolicyType.IS_ASSIGNEE:
        return this.isAssignee(userId, context.resourceId);

      case PolicyType.IS_WORKSPACE_MEMBER:
        return this.isWorkspaceMember(userId, context.workspaceId);

      case PolicyType.IS_PROJECT_MEMBER:
        return this.isProjectMember(userId, context.projectId);

      case PolicyType.IS_WORKSPACE_ADMIN:
        return this.isWorkspaceAdmin(userId, context.workspaceId);

      case PolicyType.IS_PROJECT_MANAGER:
        return this.isProjectManager(userId, context.projectId);

      case PolicyType.CAN_MANAGE_MEMBERS:
        return this.canManageMembers(userId, context.workspaceId, context.projectId);

      case PolicyType.CAN_MANAGE_SETTINGS:
        return this.canManageSettings(userId, context.workspaceId, context.projectId);

      default:
        return false;
    }
  }

  /**
   * Check if user owns the resource (workspace owner)
   */
  private async isOwner(userId: string, resourceId?: string): Promise<boolean> {
    if (!resourceId) return false;

    // Check if user is workspace owner
    const workspaceMember = await this.workspaceMemberRepository.findOne({
      where: { userId, workspaceId: resourceId, role: 'OWNER' as any },
    });
    if (workspaceMember) return true;

    // Check if it's a workspace
    const workspace = await this.workspaceRepository.findOne({
      where: { id: resourceId, createdBy: userId },
    });
    if (workspace) return true;

    return false;
  }

  /**
   * Check if user created the resource
   */
  private async isCreator(userId: string, resourceId?: string): Promise<boolean> {
    if (!resourceId) return false;

    // Check various entities
    const task = await this.taskRepository.findOne({
      where: { id: resourceId, createdBy: userId },
    });
    if (task) return true;

    const project = await this.projectRepository.findOne({
      where: { id: resourceId, createdBy: userId },
    });
    if (project) return true;

    const comment = await this.commentRepository.findOne({
      where: { id: resourceId, userId },
    });
    if (comment) return true;

    return false;
  }

  /**
   * Check if user is assignee of a task
   */
  private async isAssignee(userId: string, taskId?: string): Promise<boolean> {
    if (!taskId) return false;

    const task = await this.taskRepository.findOne({
      where: { id: taskId, assigneeId: userId },
    });

    return !!task;
  }

  /**
   * Check if user is a member of the workspace
   */
  private async isWorkspaceMember(userId: string, workspaceId?: string): Promise<boolean> {
    if (!workspaceId) return false;

    const member = await this.workspaceMemberRepository.findOne({
      where: { userId, workspaceId },
    });

    return !!member;
  }

  /**
   * Check if user is a member of the project
   */
  private async isProjectMember(userId: string, projectId?: string): Promise<boolean> {
    if (!projectId) return false;

    // First check direct project membership
    const projectMember = await this.projectMemberRepository.findOne({
      where: { userId, projectId },
    });
    if (projectMember) return true;

    // Also check if user is workspace member with access to all projects
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) return false;

    const workspaceMember = await this.workspaceMemberRepository.findOne({
      where: { userId, workspaceId: project.workspaceId },
    });

    // Workspace admins and owners have access to all projects
    if (workspaceMember && ['OWNER', 'ADMIN'].includes(workspaceMember.role)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user is a workspace admin or owner
   */
  private async isWorkspaceAdmin(userId: string, workspaceId?: string): Promise<boolean> {
    if (!workspaceId) return false;

    const member = await this.workspaceMemberRepository.findOne({
      where: { userId, workspaceId },
    });

    return member?.role === 'OWNER' || member?.role === 'ADMIN';
  }

  /**
   * Check if user is a project manager
   */
  private async isProjectManager(userId: string, projectId?: string): Promise<boolean> {
    if (!projectId) return false;

    const projectMember = await this.projectMemberRepository.findOne({
      where: { userId, projectId },
    });

    if (projectMember?.role === 'MANAGER') return true;

    // Also check if user is workspace admin (has manager rights on all projects)
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) return false;

    return this.isWorkspaceAdmin(userId, project.workspaceId);
  }

  /**
   * Check if user can manage members
   */
  private async canManageMembers(
    userId: string,
    workspaceId?: string,
    projectId?: string,
  ): Promise<boolean> {
    // For project-level member management
    if (projectId) {
      const isManager = await this.isProjectManager(userId, projectId);
      if (isManager) return true;
    }

    // For workspace-level member management
    if (workspaceId) {
      return this.isWorkspaceAdmin(userId, workspaceId);
    }

    return false;
  }

  /**
   * Check if user can manage settings
   */
  private async canManageSettings(
    userId: string,
    workspaceId?: string,
    projectId?: string,
  ): Promise<boolean> {
    // Same logic as member management
    return this.canManageMembers(userId, workspaceId, projectId);
  }

  /**
   * Check multiple policies (AND logic)
   */
  async evaluatePolicies(
    userId: string,
    policies: { type: PolicyType; context: PolicyContext }[],
  ): Promise<boolean> {
    for (const policy of policies) {
      const passed = await this.evaluatePolicy(userId, policy.type, policy.context);
      if (!passed) return false;
    }
    return true;
  }

  /**
   * Check if any policy passes (OR logic)
   */
  async evaluateAnyPolicy(
    userId: string,
    policies: { type: PolicyType; context: PolicyContext }[],
  ): Promise<boolean> {
    for (const policy of policies) {
      const passed = await this.evaluatePolicy(userId, policy.type, policy.context);
      if (passed) return true;
    }
    return false;
  }
}
