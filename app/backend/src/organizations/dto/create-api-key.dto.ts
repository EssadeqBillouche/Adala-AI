import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsArray } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @IsOptional()
  scopes?: string[];

  @IsNumber()
  @IsOptional()
  rateLimit?: number;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
