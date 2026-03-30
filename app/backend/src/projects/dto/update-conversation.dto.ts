import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ConvStatus } from '../entities/enums/conv-status.enum';
import { Locale } from '../entities/enums/locale.enum';

export class UpdateConversationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsEnum(ConvStatus)
  @IsOptional()
  status?: ConvStatus;

  @IsEnum(Locale)
  @IsOptional()
  language?: Locale;
}
