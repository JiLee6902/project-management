import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomField, TaskCustomFieldValue, Project } from '@app/entity/entities';
import { CustomFieldController } from './controller/custom-field.controller';
import { CustomFieldService } from './service/custom-field.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomField, TaskCustomFieldValue, Project])],
  controllers: [CustomFieldController],
  providers: [CustomFieldService],
  exports: [CustomFieldService],
})
export class CustomFieldModule {}
