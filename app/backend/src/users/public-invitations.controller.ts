import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('invitations')
export class PublicInvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get('accept/:token')
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
  async accept(@Body() acceptInvitationDto: AcceptInvitationDto, @CurrentUser() user: any) {
    const invitation = await this.invitationsService.accept(acceptInvitationDto.token, user.userId);
    return {
      message: 'Invitation accepted successfully',
      organizationId: invitation.organizationId,
    };
  }
}
