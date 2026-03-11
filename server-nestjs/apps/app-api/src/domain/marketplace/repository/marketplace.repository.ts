import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceTemplate, TemplateReview } from '@app/entity/entities';
import { SearchTemplateDto, SortBy } from '../dto/search-template.dto';

@Injectable()
export class MarketplaceRepository {
  constructor(
    @InjectRepository(MarketplaceTemplate)
    private readonly templateRepo: Repository<MarketplaceTemplate>,
    @InjectRepository(TemplateReview)
    private readonly reviewRepo: Repository<TemplateReview>,
  ) {}

  async createTemplate(data: Partial<MarketplaceTemplate>): Promise<MarketplaceTemplate> {
    const template = this.templateRepo.create(data);
    return this.templateRepo.save(template);
  }

  async findById(id: string): Promise<MarketplaceTemplate | null> {
    return this.templateRepo.findOne({
      where: { id },
      relations: ['author'],
    });
  }

  async search(searchDto: SearchTemplateDto): Promise<{
    templates: MarketplaceTemplate[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { query, category, type, sortBy, page = 1, limit = 20 } = searchDto;
    const qb = this.templateRepo
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.author', 'author')
      .where('template.isPublic = :isPublic', { isPublic: true })
      .andWhere('template.deletedAt IS NULL');

    if (query) {
      qb.andWhere(
        '(LOWER(template.name) LIKE LOWER(:query) OR LOWER(template.description) LIKE LOWER(:query))',
        { query: `%${query}%` },
      );
    }

    if (category) {
      qb.andWhere('template.category = :category', { category });
    }

    if (type) {
      qb.andWhere('template.type = :type', { type });
    }

    switch (sortBy) {
      case SortBy.POPULARITY:
        qb.orderBy('template.installCount', 'DESC');
        break;
      case SortBy.RATING:
        qb.orderBy('template.rating', 'DESC');
        break;
      case SortBy.NEWEST:
      default:
        qb.orderBy('template.createdAt', 'DESC');
        break;
    }

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [templates, total] = await qb.getManyAndCount();

    return { templates, total, page, limit };
  }

  async findFeatured(): Promise<MarketplaceTemplate[]> {
    return this.templateRepo.find({
      where: { isFeatured: true, isPublic: true },
      relations: ['author'],
      order: { installCount: 'DESC' },
      take: 20,
    });
  }

  async findByAuthor(authorId: string): Promise<MarketplaceTemplate[]> {
    return this.templateRepo.find({
      where: { authorId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async incrementInstallCount(templateId: string): Promise<void> {
    await this.templateRepo.increment({ id: templateId }, 'installCount', 1);
  }

  async updateRating(templateId: string): Promise<void> {
    const result = await this.reviewRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.templateId = :templateId', { templateId })
      .getRawOne();

    await this.templateRepo.update(templateId, {
      rating: parseFloat(result.avg) || 0,
      ratingCount: parseInt(result.count, 10) || 0,
    });
  }

  async createReview(data: Partial<TemplateReview>): Promise<TemplateReview> {
    const review = this.reviewRepo.create(data);
    return this.reviewRepo.save(review);
  }

  async findReviewByUserAndTemplate(
    userId: string,
    templateId: string,
  ): Promise<TemplateReview | null> {
    return this.reviewRepo.findOne({
      where: { userId, templateId },
    });
  }
}
