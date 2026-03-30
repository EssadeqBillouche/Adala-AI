import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  create(@Body() createSubscriptionDto: CreateSubscriptionDto, @CurrentUser() user: any) {
    return this.subscriptionService.create(createSubscriptionDto, user.orgId);
  }

  @Get()
  findOne() {
    return this.subscriptionService.findOne();
  }

  @Put()
  update(@Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.subscriptionService.update(updateSubscriptionDto);
  }
}
