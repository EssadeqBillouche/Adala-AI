import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';

import { CreateInvitationDto } from './dto/create-invitation.dto';
import { Invitation } from './entities/invitation.entity';
import { TenancyService } from '../tenancy/tenancy.service';
import { InviteStatus } from './entities/enums/invite-status.enum';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private tenancyService: TenancyService,
  ) {}

  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async create(createInvitationDto: CreateInvitationDto, organizationId: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const existing = await manager.findOne(Invitation, {
        where: {
          email: createInvitationDto.email,
          organizationId,
          status: InviteStatus.PENDING,
        },
      });

      if (existing) {
        throw new BadRequestException('An active invitation already exists for this email');
      }

      const token = this.generateToken();
      const expiresAt = createInvitationDto.expiresAt
        ? new Date(createInvitationDto.expiresAt)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const invitation = manager.create(Invitation, {
        ...createInvitationDto,
        token,
        expiresAt,
        organizationId,
      });

      return manager.save(Invitation, invitation);
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const skip = (page - 1) * limit;
      return manager.find(Invitation, {
        order: { createdAt: 'DESC' },
        relations: ['organization'],
        skip,
        take: limit,
      });
    });
  }

  async findOne(id: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const invitation = await manager.findOne(Invitation, {
        where: { id },
        relations: ['organization'],
      });
      if (!invitation) {
        throw new NotFoundException(`Invitation with ID ${id} not found`);
      }
      return invitation;
    });
  }

  async findByToken(token: string) {
    return this.tenancyService.runBypassingTenant(async (manager) => {
      const invitation = await manager.findOne(Invitation, {
        where: { token },
        relations: ['organization'],
      });
      if (!invitation) {
        throw new NotFoundException('Invalid invitation token');
      }
      if (invitation.isExpired()) {
        throw new BadRequestException('Invitation has expired');
      }
      return invitation;
    });
  }

  async accept(token: string, userId: string) {
    return this.tenancyService.runBypassingTenant(async (manager) => {
      const invitation = await manager.findOne(Invitation, {
        where: { token },
        relations: ['organization'],
      });

      if (!invitation) {
        throw new NotFoundException('Invalid invitation token');
      }

      if (invitation.isExpired()) {
        throw new BadRequestException('Invitation has expired');
      }

      invitation.accept();
      await manager.save(Invitation, invitation);

      const user = await manager.findOne(User, { where: { id: userId } });
      if (user) {
        user.organizationId = invitation.organizationId;
        await manager.save(User, user);
      }

      return invitation;
    });
  }

  async revoke(id: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const invitation = await manager.findOne(Invitation, { where: { id } });
      if (!invitation) {
        throw new NotFoundException(`Invitation with ID ${id} not found`);
      }
      invitation.status = InviteStatus.EXPIRED;
      return manager.save(Invitation, invitation);
    });
  }

  async remove(id: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const invitation = await manager.findOne(Invitation, { where: { id } });
      if (!invitation) {
        throw new NotFoundException(`Invitation with ID ${id} not found`);
      }
      await manager.remove(Invitation, invitation);
      return { id, deleted: true };
    });
  }
}
