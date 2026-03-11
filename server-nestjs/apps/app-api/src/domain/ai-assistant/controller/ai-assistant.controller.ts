import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guard';
import { AiAssistantService } from '../service/ai-assistant.service';
import {
  GenerateSubtasksDto,
  SuggestPriorityDto,
  EstimateTimeDto,
  SummarizeSprintDto,
  ImproveDescriptionDto,
} from '../dto';

@ApiTags('AI Assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('subtasks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate subtasks for a task using AI' })
  @ApiResponse({
    status: 200,
    description: 'Generated subtasks',
  })
  async generateSubtasks(@Body() dto: GenerateSubtasksDto) {
    return this.aiAssistantService.generateSubtasks(
      dto.taskTitle,
      dto.taskDescription,
    );
  }

  @Post('priority')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get AI-suggested priority for a task' })
  @ApiResponse({
    status: 200,
    description: 'Suggested priority with reasoning',
  })
  async suggestPriority(@Body() dto: SuggestPriorityDto) {
    return this.aiAssistantService.suggestPriority(
      dto.taskTitle,
      dto.taskDescription,
      dto.projectContext,
    );
  }

  @Post('estimate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get AI time estimate for a task' })
  @ApiResponse({
    status: 200,
    description: 'Time estimate with confidence level',
  })
  async estimateTime(@Body() dto: EstimateTimeDto) {
    return this.aiAssistantService.estimateTime(
      dto.taskTitle,
      dto.taskDescription,
      dto.subtasks,
    );
  }

  @Post('sprint-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get AI-generated sprint summary' })
  @ApiResponse({
    status: 200,
    description: 'Sprint summary with highlights, blockers, and suggestions',
  })
  async summarizeSprint(@Body() dto: SummarizeSprintDto) {
    return this.aiAssistantService.summarizeSprint(dto.tasks);
  }

  @Post('improve-description')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get AI-improved task description' })
  @ApiResponse({
    status: 200,
    description: 'Improved task description',
  })
  async improveDescription(@Body() dto: ImproveDescriptionDto) {
    return this.aiAssistantService.improveDescription(
      dto.taskTitle,
      dto.currentDescription,
    );
  }
}
