import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
import { User } from '@app/shared-libs';
import { WebhookService } from '../service/webhook.service';
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookResponseDto,
  WebhookLogResponseDto,
  WebhookTestResponseDto,
} from '../dto';

@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new webhook' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 201, description: 'Webhook created', type: WebhookResponseDto })
  async create(
    @Param('projectId') projectId: string,
    @User('id') userId: string,
    @Body() dto: CreateWebhookDto,
  ): Promise<WebhookResponseDto> {
    const webhook = await this.webhookService.create(projectId, userId, dto);
    return this.toResponse(webhook);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all webhooks for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'List of webhooks', type: [WebhookResponseDto] })
  async findByProject(
    @Param('projectId') projectId: string,
  ): Promise<WebhookResponseDto[]> {
    const webhooks = await this.webhookService.findByProject(projectId);
    return webhooks.map((w) => this.toResponse(w));
  }

  @Get(':webhookId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get webhook details' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'webhookId', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook details', type: WebhookResponseDto })
  async findById(
    @Param('webhookId') webhookId: string,
  ): Promise<WebhookResponseDto> {
    const webhook = await this.webhookService.findById(webhookId);
    return this.toResponse(webhook);
  }

  @Put(':webhookId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update webhook' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'webhookId', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook updated', type: WebhookResponseDto })
  async update(
    @Param('webhookId') webhookId: string,
    @Body() dto: UpdateWebhookDto,
  ): Promise<WebhookResponseDto> {
    const webhook = await this.webhookService.update(webhookId, dto);
    return this.toResponse(webhook);
  }

  @Delete(':webhookId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete webhook' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'webhookId', description: 'Webhook ID' })
  @ApiResponse({ status: 204, description: 'Webhook deleted' })
  async delete(@Param('webhookId') webhookId: string): Promise<void> {
    await this.webhookService.delete(webhookId);
  }

  @Post(':webhookId/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test webhook delivery' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'webhookId', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Test result', type: WebhookTestResponseDto })
  async testWebhook(
    @Param('webhookId') webhookId: string,
  ): Promise<WebhookTestResponseDto> {
    return this.webhookService.testWebhook(webhookId);
  }

  @Get(':webhookId/logs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get webhook delivery logs' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'webhookId', description: 'Webhook ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Webhook logs', type: [WebhookLogResponseDto] })
  async getWebhookLogs(
    @Param('webhookId') webhookId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ logs: WebhookLogResponseDto[]; total: number }> {
    const { logs, total } = await this.webhookService.getWebhookLogs(
      webhookId,
      limit || 50,
      offset || 0,
    );

    return {
      logs: logs.map((log) => ({
        id: log.id,
        webhookId: log.webhookId,
        event: log.event,
        payload: log.payload,
        status: log.status,
        responseStatus: log.responseStatus,
        attemptCount: log.attemptCount,
        durationMs: log.durationMs,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt,
      })),
      total,
    };
  }

  private toResponse(webhook: any): WebhookResponseDto {
    return {
      id: webhook.id,
      projectId: webhook.projectId,
      name: webhook.name,
      url: webhook.url,
      status: webhook.status,
      events: webhook.events,
      failureCount: webhook.failureCount,
      lastTriggeredAt: webhook.lastTriggeredAt,
      lastSuccessAt: webhook.lastSuccessAt,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
    };
  }
}
