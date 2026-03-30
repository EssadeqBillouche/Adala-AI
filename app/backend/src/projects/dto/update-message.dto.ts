import { IsString, IsOptional, IsEnum, IsObject, IsNumber } from 'class-validator';
import { MessageRole } from '../entities/enums/message-role.enum';

export class UpdateMessageDto {
  @IsEnum(MessageRole)
  @IsOptional()
  role?: MessageRole;

  @IsString()
  @IsOptional()
  content?: string;

  @IsNumber()
  @IsOptional()
  tokensIn?: number;

  @IsNumber()
  @IsOptional()
  tokensOut?: number;

  @IsNumber()
  @IsOptional()
  latencyMs?: number;

  @IsNumber()
  @IsOptional()
  ragScore?: number;

  @IsString()
  @IsOptional()
  errorCode?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
