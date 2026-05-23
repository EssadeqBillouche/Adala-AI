import { IsString, IsOptional, IsDateString, IsBoolean, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateApiKeyDto {
  @ApiPropertyOptional({ description: 'API key name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'API key scopes' })
  @IsArray()
  @IsOptional()
  scopes?: string[];

  @ApiPropertyOptional({ description: 'Is revoked' })
  @IsBoolean()
  @IsOptional()
  isRevoked?: boolean;

  @ApiPropertyOptional({ description: 'Expiration date' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
