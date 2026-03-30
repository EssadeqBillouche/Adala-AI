import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { SourceType } from '../entities/enums/source-type.enum';
import { LegalDomain } from '../entities/enums/legal-domain.enum';
import { Locale } from '../entities/enums/locale.enum';
import { Jurisdiction } from '../entities/enums/jurisdiction.enum';
import { EmbeddingStatus } from '../entities/enums/embedding-status.enum';

export class UpdateLegalSourceDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(SourceType)
  @IsOptional()
  sourceType?: SourceType;

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

  @IsEnum(EmbeddingStatus)
  @IsOptional()
  embeddingStatus?: EmbeddingStatus;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  s3Url?: string;
}
