import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Label, WorkspaceMember, WorkspaceRole } from '@app/entity/entities';
import { CreateLabelDto, UpdateLabelDto } from '../dto';

@Injectable()
export class LabelRepository {
  constructor(
    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
  ) {}

  async create(dto: CreateLabelDto, userId: string): Promise<Label> {
    const label = this.labelRepository.create({
      ...dto,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.labelRepository.save(label);
  }

  async findById(id: string): Promise<Label | null> {
    return this.labelRepository.findOne({
      where: { id },
      relations: ['workspace'],
    });
  }

  async findByIds(ids: string[]): Promise<Label[]> {
    if (!ids || ids.length === 0) return [];
    return this.labelRepository.find({
      where: { id: In(ids) },
    });
  }

  async findByWorkspace(workspaceId: string): Promise<Label[]> {
    return this.labelRepository.find({
      where: { workspaceId },
      order: { name: 'ASC' },
    });
  }

  async update(id: string, dto: UpdateLabelDto, userId: string): Promise<Label | null> {
    await this.labelRepository.update(id, {
      ...dto,
      updatedBy: userId,
    });
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.labelRepository.softDelete(id);
  }

  async isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
    const member = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId },
    });
    return !!member;
  }

  async isWorkspaceAdmin(workspaceId: string, userId: string): Promise<boolean> {
    const member = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId, role: WorkspaceRole.ADMIN },
    });
    return !!member;
  }
}
