import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileMetadata } from '@app/entity/entities';
import s3Config from './config/s3.config';
import { S3Service } from './service/s3.service';
import { StorageService } from './service/storage.service';

@Module({
  imports: [
    ConfigModule.forFeature(s3Config),
    TypeOrmModule.forFeature([FileMetadata]),
  ],
  providers: [S3Service, StorageService],
  exports: [S3Service, StorageService],
})
export class StorageModule {}
