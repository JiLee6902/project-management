import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '@app/entity/entities';
import { ActivityController } from './controller/activity.controller';
import { ActivityService } from './service/activity.service';
import { ActivityRepository } from './repository/activity.repository';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Activity])],
  controllers: [ActivityController],
  providers: [ActivityService, ActivityRepository],
  exports: [ActivityService],
})
export class ActivityModule {}
