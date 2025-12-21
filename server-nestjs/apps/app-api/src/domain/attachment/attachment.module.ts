import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskAttachment } from '@app/entity/entities';
import { AttachmentController } from './controller/attachment.controller';
import { AttachmentService } from './service/attachment.service';
import { AttachmentRepository } from './repository/attachment.repository';
import { StorageModule } from '@app/external-infra/storage';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskAttachment]),
    StorageModule,
  ],
  controllers: [AttachmentController],
  providers: [AttachmentService, AttachmentRepository],
  exports: [AttachmentService],
})
export class AttachmentModule {}
