import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Label, WorkspaceMember } from '@app/entity/entities';
import { LabelController } from './controller/label.controller';
import { LabelService } from './service/label.service';
import { LabelRepository } from './repository/label.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Label, WorkspaceMember])],
  controllers: [LabelController],
  providers: [LabelService, LabelRepository],
  exports: [LabelService, LabelRepository],
})
export class LabelModule {}
