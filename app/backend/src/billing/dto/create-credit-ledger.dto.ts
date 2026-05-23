import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../entities/enums/transaction-type.enum';

export class CreateCreditLedgerDto {
  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type!: TransactionType;

  @ApiProperty({ description: 'Transaction amount (positive for credits, negative for debits)', example: 500 })
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @ApiPropertyOptional({ description: 'Reason for transaction', example: 'Monthly subscription top-up' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({ description: 'Idempotency key to prevent duplicate transactions', example: 'txn_123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;
}
