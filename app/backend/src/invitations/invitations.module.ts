import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation } from './entities/invitation.entity';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { PublicInvitationsController } from './public-invitations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Invitation])],
  providers: [InvitationsService],
  controllers: [InvitationsController, PublicInvitationsController],
  exports: [InvitationsService],
})
export class InvitationsModule {}
