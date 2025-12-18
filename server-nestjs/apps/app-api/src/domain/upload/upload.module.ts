import { Module } from '@nestjs/common';
import { StorageModule } from '@app/external-infra/storage';
import { UploadController } from './controller/upload.controller';

@Module({
  imports: [StorageModule],
  controllers: [UploadController],
})
export class UploadModule {}
