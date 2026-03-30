import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@ApiTags('invitations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new invitation (OWNER/ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input or existing invitation' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() createInvitationDto: CreateInvitationDto, @CurrentUser() user: any) {
    return this.invitationsService.create(createInvitationDto, user.orgId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all invitations for the current organization (OWNER/ADMIN only)' })
  @ApiResponse({ status: 200, description: 'List of invitations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  findAll() {
    return this.invitationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific invitation by ID (OWNER/ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Invitation UUID' })
  @ApiResponse({ status: 200, description: 'Invitation found' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  findOne(@Param('id') id: string) {
    return this.invitationsService.findOne(id);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke an invitation (OWNER/ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Invitation UUID' })
  @ApiResponse({ status: 200, description: 'Invitation revoked successfully' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  revoke(@Param('id') id: string) {
    return this.invitationsService.revoke(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an invitation (OWNER/ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Invitation UUID' })
  @ApiResponse({ status: 200, description: 'Invitation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  remove(@Param('id') id: string) {
    return this.invitationsService.remove(id);
  }
}
