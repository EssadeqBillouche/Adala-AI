import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { LegalSourcesService } from './legal-sources.service';
import { CreateLegalSourceDto } from './dto/create-legal-source.dto';
import { UpdateLegalSourceDto } from './dto/update-legal-source.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('legal-sources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('legal-sources')
export class LegalSourcesController {
  constructor(private readonly legalSourcesService: LegalSourcesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new legal source' })
  @ApiResponse({ status: 201, description: 'Legal source created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createLegalSourceDto: CreateLegalSourceDto, @CurrentUser() user: any) {
    return this.legalSourcesService.create(createLegalSourceDto, user.orgId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all legal sources for the current organization' })
  @ApiResponse({ status: 200, description: 'List of legal sources' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.legalSourcesService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific legal source by ID' })
  @ApiParam({ name: 'id', description: 'Legal Source UUID' })
  @ApiResponse({ status: 200, description: 'Legal source found' })
  @ApiResponse({ status: 404, description: 'Legal source not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.legalSourcesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a legal source' })
  @ApiParam({ name: 'id', description: 'Legal Source UUID' })
  @ApiResponse({ status: 200, description: 'Legal source updated successfully' })
  @ApiResponse({ status: 404, description: 'Legal source not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateLegalSourceDto: UpdateLegalSourceDto) {
    return this.legalSourcesService.update(id, updateLegalSourceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a legal source' })
  @ApiParam({ name: 'id', description: 'Legal Source UUID' })
  @ApiResponse({ status: 200, description: 'Legal source deleted successfully' })
  @ApiResponse({ status: 404, description: 'Legal source not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.legalSourcesService.remove(id);
  }
}
