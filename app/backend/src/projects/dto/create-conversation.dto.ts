import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { Locale } from '../entities/enums/locale.enum';

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsEnum(Locale)
  @IsOptional()
  language?: Locale;

  @IsString()
  @IsNotEmpty()
  projectId!: string;
}
