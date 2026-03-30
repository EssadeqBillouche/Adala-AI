import { IsString, IsOptional, IsDateString, IsBoolean, IsArray } from 'class-validator';

export class UpdateApiKeyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsOptional()
  scopes?: string[];

  @IsBoolean()
  @IsOptional()
  isRevoked?: boolean;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
