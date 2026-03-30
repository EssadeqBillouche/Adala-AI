import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Locale } from '../entities/enums/locale.enum';

export class CreateConversationDto {
  @ApiProperty({ description: 'Conversation title', example: 'Legal Research Session 1' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Conversation summary', example: 'Research on Moroccan commercial law' })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({ description: 'Language', enum: Locale, default: Locale.EN })
  @IsEnum(Locale)
  @IsOptional()
  language?: Locale;

  @ApiProperty({ description: 'Associated project ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;
}
