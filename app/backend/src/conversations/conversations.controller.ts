import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createConversationDto: CreateConversationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.conversationsService.create(createConversationDto, user.orgId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all conversations for the current organization' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query('projectId') projectId?: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.conversationsService.findAll(projectId, Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific conversation by ID' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({ status: 200, description: 'Conversation found' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.conversationsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({ status: 200, description: 'Conversation updated successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateConversationDto: UpdateConversationDto) {
    return this.conversationsService.update(id, updateConversationDto);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({ status: 200, description: 'Conversation archived successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.conversationsService.archive(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore an archived conversation' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({ status: 200, description: 'Conversation restored successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.conversationsService.restore(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({ status: 200, description: 'Conversation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.conversationsService.remove(id);
  }
}
