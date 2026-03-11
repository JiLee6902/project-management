import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { MarketplaceTemplate } from './marketplace-template.entity';

@Entity('template_reviews')
@Unique(['templateId', 'userId'])
export class TemplateReview extends BaseEntity {
  @Column({ name: 'template_id' })
  @Index()
  templateId: string;

  @ManyToOne(() => MarketplaceTemplate, (template) => template.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'template_id' })
  template: MarketplaceTemplate;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;
}
