import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Invitation } from './entities/invitation.entity';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { PublicInvitationsController } from './public-invitations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Invitation])],
  providers: [UsersService, InvitationsService],
  controllers: [InvitationsController, PublicInvitationsController],
  exports: [UsersService, InvitationsService],
})
export class UsersModule {}
