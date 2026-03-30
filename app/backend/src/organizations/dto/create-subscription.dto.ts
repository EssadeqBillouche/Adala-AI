import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubStatus } from '../entities/enums/sub-status.enum';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Stripe subscription ID', example: 'sub_1234567890' })
  @IsString()
  @IsNotEmpty()
  stripeSubscriptionId!: string;

  @ApiProperty({ description: 'Stripe customer ID', example: 'cus_1234567890' })
  @IsString()
  @IsNotEmpty()
  stripeCustomerId!: string;

  @ApiProperty({ description: 'Stripe price ID', example: 'price_1234567890' })
  @IsString()
  @IsNotEmpty()
  stripePriceId!: string;

  @ApiPropertyOptional({ description: 'Subscription status', enum: SubStatus, default: SubStatus.ACTIVE })
  @IsEnum(SubStatus)
  @IsOptional()
  status?: SubStatus;

  @ApiPropertyOptional({ description: 'Monthly credits allocation', example: 10000 })
  @IsNumber()
  @IsOptional()
  monthlyCreditsAlloc?: number;

  @ApiProperty({ description: 'Current period start date', example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  currentPeriodStart!: string;

  @ApiProperty({ description: 'Current period end date', example: '2024-02-01T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  currentPeriodEnd!: string;

  @ApiPropertyOptional({ description: 'Cancel at period end', example: false })
  @IsBoolean()
  @IsOptional()
  cancelAtPeriodEnd?: boolean;

  @ApiPropertyOptional({ description: 'Trial end date', example: '2024-01-15T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  trialEndsAt?: string;
}
