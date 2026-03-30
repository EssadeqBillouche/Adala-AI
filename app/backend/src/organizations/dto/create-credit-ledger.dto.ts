import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { TransactionType } from '../entities/enums/transaction-type.enum';

export class CreateCreditLedgerDto {
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type!: TransactionType;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsNumber()
  @IsNotEmpty()
  balanceBefore!: number;

  @IsNumber()
  @IsNotEmpty()
  balanceAfter!: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;
}
