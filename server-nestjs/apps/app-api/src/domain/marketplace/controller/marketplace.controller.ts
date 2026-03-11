import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MarketplaceService } from '../service/marketplace.service';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { User, CurrentUser } from '@app/shared-libs';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { SearchTemplateDto } from '../dto/search-template.dto';
import { ReviewTemplateDto } from '../dto/review-template.dto';

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('templates')
  @ApiOperation({ summary: 'Search marketplace templates' })
  async searchTemplates(@Query() searchDto: SearchTemplateDto) {
    return this.marketplaceService.searchTemplates(searchDto);
  }

  @Get('templates/featured')
  @ApiOperation({ summary: 'Get featured templates' })
  async getFeaturedTemplates() {
    return this.marketplaceService.getFeaturedTemplates();
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get template details' })
  async getTemplate(@Param('id') id: string) {
    return this.marketplaceService.getTemplateById(id);
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a new template' })
  async publishTemplate(
    @User() user: CurrentUser,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.marketplaceService.publishTemplate(user.id, dto);
  }

  @Post('templates/:id/install')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Install a template into a workspace' })
  async installTemplate(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body('workspaceId') workspaceId: string,
  ) {
    return this.marketplaceService.installTemplate(user.id, id, workspaceId);
  }

  @Post('templates/:id/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review a template' })
  async reviewTemplate(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ReviewTemplateDto,
  ) {
    return this.marketplaceService.reviewTemplate(user.id, id, dto);
  }

  @Get('my-templates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my published templates' })
  async getMyTemplates(@User() user: CurrentUser) {
    return this.marketplaceService.getMyTemplates(user.id);
  }
}
