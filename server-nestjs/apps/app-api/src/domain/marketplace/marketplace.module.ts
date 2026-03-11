import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceTemplate, TemplateReview, Project } from '@app/entity/entities';
import { MarketplaceController } from './controller/marketplace.controller';
import { MarketplaceService } from './service/marketplace.service';
import { MarketplaceRepository } from './repository/marketplace.repository';
import { MarketplaceSeedService } from './service/marketplace-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([MarketplaceTemplate, TemplateReview, Project])],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, MarketplaceRepository, MarketplaceSeedService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
