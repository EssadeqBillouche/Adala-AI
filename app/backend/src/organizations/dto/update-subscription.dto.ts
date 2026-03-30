import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsBoolean } from 'class-validator';
import { SubStatus } from '../entities/enums/sub-status.enum';

export class UpdateSubscriptionDto {
  @IsEnum(SubStatus)
  @IsOptional()
  status?: SubStatus;

  @IsNumber()
  @IsOptional()
  monthlyCreditsAlloc?: number;

  @IsDateString()
  @IsOptional()
  currentPeriodStart?: string;

  @IsDateString()
  @IsOptional()
  currentPeriodEnd?: string;

  @IsBoolean()
  @IsOptional()
  cancelAtPeriodEnd?: boolean;

  @IsDateString()
  @IsOptional()
  trialEndsAt?: string;
}
