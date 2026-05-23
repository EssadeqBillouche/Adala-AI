import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Subscription } from './entities/subscription.entity';
import { TenancyService } from '../tenancy/tenancy.service';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private tenancyService: TenancyService,
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionDto, organizationId: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const subscription = manager.create(Subscription, {
        ...createSubscriptionDto,
        organizationId,
      });
      return manager.save(Subscription, subscription);
    });
  }

  async findOne() {
    return this.tenancyService.runWithTenant(async (manager) => {
      const subscription = await manager.findOne(Subscription, {
        where: {},
      });
      if (!subscription) {
        throw new NotFoundException('No subscription found for this organization');
      }
      return subscription;
    });
  }

  async update(updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const subscription = await manager.findOne(Subscription, { where: {} });
      if (!subscription) {
        throw new NotFoundException('No subscription found for this organization');
      }
      if (updateSubscriptionDto.status !== undefined) subscription.status = updateSubscriptionDto.status;
      if (updateSubscriptionDto.monthlyCreditsAlloc !== undefined) subscription.monthlyCreditsAlloc = updateSubscriptionDto.monthlyCreditsAlloc;
      if (updateSubscriptionDto.currentPeriodStart !== undefined) subscription.currentPeriodStart = updateSubscriptionDto.currentPeriodStart as any;
      if (updateSubscriptionDto.currentPeriodEnd !== undefined) subscription.currentPeriodEnd = updateSubscriptionDto.currentPeriodEnd as any;
      if (updateSubscriptionDto.cancelAtPeriodEnd !== undefined) subscription.cancelAtPeriodEnd = updateSubscriptionDto.cancelAtPeriodEnd;
      if (updateSubscriptionDto.trialEndsAt !== undefined) subscription.trialEndsAt = updateSubscriptionDto.trialEndsAt as any;
      return manager.save(Subscription, subscription);
    });
  }
}
