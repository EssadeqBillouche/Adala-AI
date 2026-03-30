import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { SourceType } from '../entities/enums/source-type.enum';
import { LegalDomain } from '../entities/enums/legal-domain.enum';
import { Locale } from '../entities/enums/locale.enum';
import { Jurisdiction } from '../entities/enums/jurisdiction.enum';

export class CreateLegalSourceDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsString()
  @IsOptional()
  fileType?: string;

  @IsEnum(SourceType)
  @IsNotEmpty()
  sourceType!: SourceType;

  @IsString()
  @IsOptional()
  articleRef?: string;

  @IsString()
  @IsOptional()
  dahirNumber?: string;

  @IsString()
  @IsOptional()
  bulletinNumber?: string;

  @IsEnum(Locale)
  @IsOptional()
  language?: Locale;

  @IsEnum(LegalDomain)
  @IsOptional()
  legalDomain?: LegalDomain;

  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @IsEnum(Jurisdiction)
  @IsOptional()
  jurisdiction?: Jurisdiction;

  @IsString()
  @IsOptional()
  s3Url?: string;
}
