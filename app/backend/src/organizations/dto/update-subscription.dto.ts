import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubStatus } from '../entities/enums/sub-status.enum';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ description: 'Subscription status', enum: SubStatus })
  @IsEnum(SubStatus)
  @IsOptional()
  status?: SubStatus;

  @ApiPropertyOptional({ description: 'Monthly credits allocation' })
  @IsNumber()
  @IsOptional()
  monthlyCreditsAlloc?: number;

  @ApiPropertyOptional({ description: 'Current period start date' })
  @IsDateString()
  @IsOptional()
  currentPeriodStart?: string;

  @ApiPropertyOptional({ description: 'Current period end date' })
  @IsDateString()
  @IsOptional()
  currentPeriodEnd?: string;

  @ApiPropertyOptional({ description: 'Cancel at period end' })
  @IsBoolean()
  @IsOptional()
  cancelAtPeriodEnd?: boolean;

  @ApiPropertyOptional({ description: 'Trial end date' })
  @IsDateString()
  @IsOptional()
  trialEndsAt?: string;
}
