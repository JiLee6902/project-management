import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project, Task } from '@app/entity/entities';
import { ExportController } from './controller/export.controller';
import { ExportService } from './service/export.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Task])],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
