import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '@app/entity/entities/audit-log.entity';
import { AuditLogController } from './controller/audit-log.controller';
import { AuditLogService } from './service/audit-log.service';
import { AuditLogRepository } from './repository/audit-log.repository';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditLogController],
  providers: [AuditLogService, AuditLogRepository],
  exports: [AuditLogService],
})
export class AuditLogModule {}
