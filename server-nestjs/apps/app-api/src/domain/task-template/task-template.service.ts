import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskTemplate, WorkspaceMember, WorkspaceRole } from '@app/entity/entities';
import { CreateTaskTemplateDto, UpdateTaskTemplateDto } from './dto';

@Injectable()
export class TaskTemplateService {
  constructor(
    @InjectRepository(TaskTemplate)
    private readonly templateRepository: Repository<TaskTemplate>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
  ) {}

  async getTemplatesByWorkspace(workspaceId: string) {
    const templates = await this.templateRepository.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
    return { templates };
  }

  async getTemplateById(id: string) {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return { template };
  }

  async createTemplate(userId: string, dto: CreateTaskTemplateDto) {
    const isAdmin = await this.isWorkspaceAdmin(dto.workspaceId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only workspace admin can create templates');
    }

    const template = this.templateRepository.create({
      name: dto.name,
      description: dto.description,
      workspaceId: dto.workspaceId,
      type: dto.type,
      priority: dto.priority,
      estimatedTime: dto.estimatedTime,
      storyPoints: dto.storyPoints,
      subtasks: dto.subtasks,
      checklist: dto.checklist,
    });

    await this.templateRepository.save(template);
    return { template, message: 'Template created successfully' };
  }

  async updateTemplate(userId: string, id: string, dto: UpdateTaskTemplateDto) {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const isAdmin = await this.isWorkspaceAdmin(template.workspaceId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only workspace admin can update templates');
    }

    await this.templateRepository.update(id, dto);
    const updatedTemplate = await this.templateRepository.findOne({ where: { id } });
    return { template: updatedTemplate, message: 'Template updated successfully' };
  }

  async deleteTemplate(userId: string, id: string) {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const isAdmin = await this.isWorkspaceAdmin(template.workspaceId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only workspace admin can delete templates');
    }

    await this.templateRepository.delete(id);
    return { message: 'Template deleted successfully' };
  }

  private async isWorkspaceAdmin(workspaceId: string, userId: string): Promise<boolean> {
    const member = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId, role: WorkspaceRole.ADMIN },
    });
    return !!member;
  }
}
