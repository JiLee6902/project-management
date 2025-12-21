import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '@app/entity/entities';
import { NotificationController } from './controller/notification.controller';
import { NotificationService } from './service/notification.service';
import { NotificationRepository } from './repository/notification.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository],
  exports: [NotificationService],
})
export class NotificationModule {}
