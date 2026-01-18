import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guard';
import { AuditLogService } from '../service/audit-log.service';
import { AuditLogQueryDto } from '../dto';
import { AuditEntity } from '@app/entity/entities/audit-log.entity';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Query audit logs with filters' })
  @ApiResponse({ status: 200, description: 'List of audit logs' })
  async query(@Query() query: AuditLogQueryDto) {
    return this.auditLogService.query({
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiParam({ name: 'id', description: 'Audit log ID' })
  @ApiResponse({ status: 200, description: 'Audit log details' })
  async findById(@Param('id') id: string) {
    return this.auditLogService.findById(id);
  }

  @Get('entity/:entityType/:entityId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get audit history for an entity' })
  @ApiParam({ name: 'entityType', enum: AuditEntity })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiResponse({ status: 200, description: 'Entity audit history' })
  async getEntityHistory(
    @Param('entityType') entityType: AuditEntity,
    @Param('entityId') entityId: string,
  ) {
    return this.auditLogService.getEntityHistory(entityType, entityId);
  }

  @Get('user/:userId/activity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user activity' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'User activity logs' })
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditLogService.getUserActivity(userId, limit || 50);
  }

  @Get('workspace/:workspaceId/statistics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get audit statistics for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Audit statistics' })
  async getStatistics(
    @Param('workspaceId') workspaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.auditLogService.getStatistics(
      workspaceId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
