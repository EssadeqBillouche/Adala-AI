import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SourceType } from '../entities/enums/source-type.enum';
import { LegalDomain } from '../entities/enums/legal-domain.enum';
import { Locale } from '../entities/enums/locale.enum';
import { Jurisdiction } from '../entities/enums/jurisdiction.enum';
import { EmbeddingStatus } from '../entities/enums/embedding-status.enum';

export class UpdateLegalSourceDto {
  @ApiPropertyOptional({ description: 'Legal source title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Source type', enum: SourceType })
  @IsEnum(SourceType)
  @IsOptional()
  sourceType?: SourceType;

  @ApiPropertyOptional({ description: 'Article reference' })
  @IsString()
  @IsOptional()
  articleRef?: string;

  @ApiPropertyOptional({ description: 'Dahir number' })
  @IsString()
  @IsOptional()
  dahirNumber?: string;

  @ApiPropertyOptional({ description: 'Bulletin number' })
  @IsString()
  @IsOptional()
  bulletinNumber?: string;

  @ApiPropertyOptional({ description: 'Language', enum: Locale })
  @IsEnum(Locale)
  @IsOptional()
  language?: Locale;

  @ApiPropertyOptional({ description: 'Legal domain', enum: LegalDomain })
  @IsEnum(LegalDomain)
  @IsOptional()
  legalDomain?: LegalDomain;

  @ApiPropertyOptional({ description: 'Effective date' })
  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @ApiPropertyOptional({ description: 'Jurisdiction', enum: Jurisdiction })
  @IsEnum(Jurisdiction)
  @IsOptional()
  jurisdiction?: Jurisdiction;

  @ApiPropertyOptional({ description: 'Embedding status', enum: EmbeddingStatus })
  @IsEnum(EmbeddingStatus)
  @IsOptional()
  embeddingStatus?: EmbeddingStatus;

  @ApiPropertyOptional({ description: 'Is active (not abrogated)' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'S3 storage URL' })
  @IsString()
  @IsOptional()
  s3Url?: string;
}
