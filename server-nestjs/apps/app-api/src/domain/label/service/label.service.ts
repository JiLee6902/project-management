import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LabelRepository } from '../repository/label.repository';
import { CreateLabelDto, UpdateLabelDto } from '../dto';
import { Label } from '@app/entity/entities';

@Injectable()
export class LabelService {
  constructor(private readonly labelRepository: LabelRepository) {}

  async create(userId: string, dto: CreateLabelDto): Promise<Label> {
    // Check if user is workspace member
    const isMember = await this.labelRepository.isWorkspaceMember(dto.workspaceId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return this.labelRepository.create(dto, userId);
  }

  async findById(id: string): Promise<Label> {
    const label = await this.labelRepository.findById(id);
    if (!label) {
      throw new NotFoundException('Label not found');
    }
    return label;
  }

  async findByWorkspace(workspaceId: string, userId: string): Promise<Label[]> {
    // Check if user is workspace member
    const isMember = await this.labelRepository.isWorkspaceMember(workspaceId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return this.labelRepository.findByWorkspace(workspaceId);
  }

  async update(userId: string, id: string, dto: UpdateLabelDto): Promise<Label> {
    const label = await this.findById(id);

    // Check if user is workspace member
    const isMember = await this.labelRepository.isWorkspaceMember(label.workspaceId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const updated = await this.labelRepository.update(id, dto, userId);
    if (!updated) {
      throw new NotFoundException('Label not found');
    }
    return updated;
  }

  async delete(userId: string, id: string): Promise<void> {
    const label = await this.findById(id);

    // Check if user is workspace admin
    const isAdmin = await this.labelRepository.isWorkspaceAdmin(label.workspaceId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only workspace admin can delete labels');
    }

    await this.labelRepository.delete(id);
  }
}
