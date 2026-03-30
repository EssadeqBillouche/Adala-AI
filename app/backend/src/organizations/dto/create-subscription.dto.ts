import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { SubStatus } from '../entities/enums/sub-status.enum';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  stripeSubscriptionId!: string;

  @IsString()
  @IsNotEmpty()
  stripeCustomerId!: string;

  @IsString()
  @IsNotEmpty()
  stripePriceId!: string;

  @IsEnum(SubStatus)
  @IsOptional()
  status?: SubStatus;

  @IsNumber()
  @IsOptional()
  monthlyCreditsAlloc?: number;

  @IsDateString()
  @IsNotEmpty()
  currentPeriodStart!: string;

  @IsDateString()
  @IsNotEmpty()
  currentPeriodEnd!: string;

  @IsOptional()
  cancelAtPeriodEnd?: boolean;

  @IsDateString()
  @IsOptional()
  trialEndsAt?: string;
}
