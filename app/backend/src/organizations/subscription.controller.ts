import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('subscription')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createSubscriptionDto: CreateSubscriptionDto, @CurrentUser() user: any) {
    return this.subscriptionService.create(createSubscriptionDto, user.orgId);
  }

  @Get()
  @ApiOperation({ summary: 'Get current organization subscription' })
  @ApiResponse({ status: 200, description: 'Subscription details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No subscription found' })
  findOne() {
    return this.subscriptionService.findOne();
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No subscription found' })
  update(@Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.subscriptionService.update(updateSubscriptionDto);
  }
}
