import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationRule, Task, Label, Sprint } from '@app/entity/entities';
import { AutomationController } from './controller/automation.controller';
import { AutomationService } from './service/automation.service';

@Module({
  imports: [TypeOrmModule.forFeature([AutomationRule, Task, Label, Sprint])],
  controllers: [AutomationController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
