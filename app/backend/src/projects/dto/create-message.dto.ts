import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { MessageRole } from '../entities/enums/message-role.enum';

export class CreateMessageDto {
  @IsEnum(MessageRole)
  @IsNotEmpty()
  role!: MessageRole;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  tokensIn?: number;

  @IsOptional()
  tokensOut?: number;

  @IsOptional()
  latencyMs?: number;

  @IsOptional()
  ragScore?: number;

  @IsOptional()
  errorCode?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsString()
  @IsNotEmpty()
  conversationId!: string;
}
