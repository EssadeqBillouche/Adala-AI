import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConvStatus } from '../entities/enums/conv-status.enum';
import { Locale } from '../../common/enums/locale.enum';

export class UpdateConversationDto {
  @ApiPropertyOptional({ description: 'Conversation title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Conversation summary' })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({ description: 'Conversation status', enum: ConvStatus })
  @IsEnum(ConvStatus)
  @IsOptional()
  status?: ConvStatus;

  @ApiPropertyOptional({ description: 'Language', enum: Locale })
  @IsEnum(Locale)
  @IsOptional()
  language?: Locale;
}
