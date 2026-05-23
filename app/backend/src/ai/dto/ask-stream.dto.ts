import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AskStreamDto {
  @ApiProperty({ description: 'The question to ask the AI engine', example: 'What does Article 42 say about liability?' })
  @IsString()
  @IsNotEmpty()
  question!: string;

  @ApiPropertyOptional({ description: 'Optional conversation ID for context', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsOptional()
  conversationId?: string;
}
