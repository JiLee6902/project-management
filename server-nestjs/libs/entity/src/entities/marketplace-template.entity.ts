import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Workspace } from './workspace.entity';

export enum TemplateCategory {
  PROJECT_MANAGEMENT = 'PROJECT_MANAGEMENT',
  SOFTWARE_DEV = 'SOFTWARE_DEV',
  MARKETING = 'MARKETING',
  DESIGN = 'DESIGN',
  HR = 'HR',
  EDUCATION = 'EDUCATION',
  FINANCE = 'FINANCE',
  OTHER = 'OTHER',
}

export enum TemplateType {
  PROJECT = 'PROJECT',
  TASK = 'TASK',
  WORKFLOW = 'WORKFLOW',
}

@Entity('marketplace_templates')
export class MarketplaceTemplate extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: TemplateCategory,
    default: TemplateCategory.OTHER,
  })
  @Index()
  category: TemplateCategory;

  @Column({
    type: 'enum',
    enum: TemplateType,
    default: TemplateType.PROJECT,
  })
  @Index()
  type: TemplateType;

  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl?: string;

  @Column({ name: 'template_data', type: 'jsonb' })
  templateData: Record<string, any>;

  @Column({ name: 'author_id', nullable: true })
  @Index()
  authorId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'workspace_id', nullable: true })
  @Index()
  workspaceId?: string;

  @ManyToOne(() => Workspace, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'workspace_id' })
  workspace?: Workspace;

  @Column({ name: 'is_public', type: 'boolean', default: true })
  isPublic: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ name: 'install_count', type: 'int', default: 0 })
  installCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount: number;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ default: '1.0.0' })
  version: string;

  @OneToMany(
    'TemplateReview',
    (review: any) => review.template,
  )
  reviews: any[];
}
