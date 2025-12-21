import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedFilter } from '@app/entity/entities';
import { SavedFilterController } from './controller/saved-filter.controller';
import { SavedFilterService } from './service/saved-filter.service';
import { SavedFilterRepository } from './repository/saved-filter.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SavedFilter])],
  controllers: [SavedFilterController],
  providers: [SavedFilterService, SavedFilterRepository],
  exports: [SavedFilterService],
})
export class SavedFilterModule {}
