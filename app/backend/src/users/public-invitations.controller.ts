import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('invitations')
@Controller('invitations')
export class PublicInvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get('accept/:token')
  @ApiOperation({ summary: 'Validate an invitation token (public endpoint)' })
  @ApiParam({ name: 'token', description: 'Invitation token' })
  @ApiResponse({ status: 200, description: 'Invitation is valid' })
  @ApiResponse({ status: 400, description: 'Invitation expired or invalid' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async findByToken(@Param('token') token: string) {
    const invitation = await this.invitationsService.findByToken(token);
    return {
      valid: true,
      email: invitation.email,
      role: invitation.role,
      organizationName: invitation.organization.name,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('accept')
  @ApiOperation({ summary: 'Accept an invitation (authenticated user)' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({ status: 400, description: 'Invitation expired or invalid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async accept(@Body() acceptInvitationDto: AcceptInvitationDto, @CurrentUser() user: any) {
    const invitation = await this.invitationsService.accept(acceptInvitationDto.token, user.userId);
    return {
      message: 'Invitation accepted successfully',
      organizationId: invitation.organizationId,
    };
  }
}
