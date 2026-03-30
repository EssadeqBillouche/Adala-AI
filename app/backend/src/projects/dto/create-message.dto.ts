import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageRole } from '../entities/enums/message-role.enum';

export class CreateMessageDto {
  @ApiProperty({ description: 'Message role', enum: MessageRole })
  @IsEnum(MessageRole)
  @IsNotEmpty()
  role!: MessageRole;

  @ApiProperty({ description: 'Message content', example: 'What are the requirements for commercial contracts?' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ description: 'Input tokens count', example: 150 })
  @IsOptional()
  tokensIn?: number;

  @ApiPropertyOptional({ description: 'Output tokens count', example: 300 })
  @IsOptional()
  tokensOut?: number;

  @ApiPropertyOptional({ description: 'Response latency in milliseconds', example: 1200 })
  @IsOptional()
  latencyMs?: number;

  @ApiPropertyOptional({ description: 'RAG relevance score', example: 0.85 })
  @IsOptional()
  ragScore?: number;

  @ApiPropertyOptional({ description: 'Error code if failed', example: 'RATE_LIMIT_EXCEEDED' })
  @IsOptional()
  errorCode?: string;

  @ApiPropertyOptional({ description: 'Additional metadata', example: { model: 'gpt-4', temperature: 0.7 } })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiProperty({ description: 'Associated conversation ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;
}
