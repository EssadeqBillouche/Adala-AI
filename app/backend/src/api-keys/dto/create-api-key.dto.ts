import { IsString, IsOptional, IsDateString, IsNumber, IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'API key name', example: 'Production Key' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'API key scopes', example: ['read', 'write'] })
  @IsArray()
  @IsOptional()
  scopes?: string[];

  @ApiPropertyOptional({ description: 'Rate limit (requests per minute)', example: 100 })
  @IsNumber()
  @IsOptional()
  rateLimit?: number;

  @ApiPropertyOptional({ description: 'Expiration date', example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
