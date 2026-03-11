import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '@app/entity/entities';
import { MarketplaceRepository } from '../repository/marketplace.repository';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { SearchTemplateDto } from '../dto/search-template.dto';
import { ReviewTemplateDto } from '../dto/review-template.dto';

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly marketplaceRepo: MarketplaceRepository,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async publishTemplate(userId: string, dto: CreateTemplateDto) {
    const template = await this.marketplaceRepo.createTemplate({
      ...dto,
      authorId: userId,
      isPublic: dto.isPublic ?? true,
      tags: dto.tags || [],
      createdBy: userId,
    });

    return { template, message: 'Template published successfully' };
  }

  async searchTemplates(searchDto: SearchTemplateDto) {
    const result = await this.marketplaceRepo.search(searchDto);
    return {
      templates: result.templates,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    };
  }

  async getTemplateById(id: string) {
    const template = await this.marketplaceRepo.findById(id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return { template };
  }

  async getFeaturedTemplates() {
    const templates = await this.marketplaceRepo.findFeatured();
    return { templates };
  }

  async installTemplate(
    userId: string,
    templateId: string,
    workspaceId: string,
  ) {
    const template = await this.marketplaceRepo.findById(templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (!template.isPublic && template.authorId !== userId) {
      throw new BadRequestException(
        'This template is not available for installation',
      );
    }

    // Create a project from the template data
    const templateData = template.templateData;

    const project = this.projectRepo.create({
      name: templateData.name || template.name,
      description: templateData.description || template.description,
      workspaceId,
      teamLead: userId,
      createdBy: userId,
    });

    const savedProject = await this.projectRepo.save(project);

    // Increment install count
    await this.marketplaceRepo.incrementInstallCount(templateId);

    return {
      project: savedProject,
      message: 'Template installed successfully',
    };
  }

  async reviewTemplate(
    userId: string,
    templateId: string,
    dto: ReviewTemplateDto,
  ) {
    const template = await this.marketplaceRepo.findById(templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const existingReview =
      await this.marketplaceRepo.findReviewByUserAndTemplate(
        userId,
        templateId,
      );
    if (existingReview) {
      throw new ConflictException(
        'You have already reviewed this template',
      );
    }

    const review = await this.marketplaceRepo.createReview({
      templateId,
      userId,
      rating: dto.rating,
      comment: dto.comment,
      createdBy: userId,
    });

    // Recalculate average rating
    await this.marketplaceRepo.updateRating(templateId);

    return { review, message: 'Review submitted successfully' };
  }

  async getMyTemplates(userId: string) {
    const templates = await this.marketplaceRepo.findByAuthor(userId);
    return { templates };
  }

  async incrementInstallCount(templateId: string) {
    await this.marketplaceRepo.incrementInstallCount(templateId);
  }
}
