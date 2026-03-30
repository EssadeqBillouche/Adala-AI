import { IsString, IsOptional, IsEnum, IsObject, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MessageRole } from '../entities/enums/message-role.enum';

export class UpdateMessageDto {
  @ApiPropertyOptional({ description: 'Message role', enum: MessageRole })
  @IsEnum(MessageRole)
  @IsOptional()
  role?: MessageRole;

  @ApiPropertyOptional({ description: 'Message content' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Input tokens count' })
  @IsNumber()
  @IsOptional()
  tokensIn?: number;

  @ApiPropertyOptional({ description: 'Output tokens count' })
  @IsNumber()
  @IsOptional()
  tokensOut?: number;

  @ApiPropertyOptional({ description: 'Response latency in milliseconds' })
  @IsNumber()
  @IsOptional()
  latencyMs?: number;

  @ApiPropertyOptional({ description: 'RAG relevance score' })
  @IsNumber()
  @IsOptional()
  ragScore?: number;

  @ApiPropertyOptional({ description: 'Error code' })
  @IsString()
  @IsOptional()
  errorCode?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
