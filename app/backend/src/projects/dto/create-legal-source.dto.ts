import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SourceType } from '../entities/enums/source-type.enum';
import { LegalDomain } from '../entities/enums/legal-domain.enum';
import { Locale } from '../entities/enums/locale.enum';
import { Jurisdiction } from '../entities/enums/jurisdiction.enum';

export class CreateLegalSourceDto {
  @ApiProperty({ description: 'Legal source title', example: 'Dahir on Commercial Contracts' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Original file name', example: 'dahir_2024.pdf' })
  @IsString()
  @IsOptional()
  fileName?: string;

  @ApiPropertyOptional({ description: 'File type', example: 'application/pdf' })
  @IsString()
  @IsOptional()
  fileType?: string;

  @ApiProperty({ description: 'Source type', enum: SourceType })
  @IsEnum(SourceType)
  @IsNotEmpty()
  sourceType!: SourceType;

  @ApiPropertyOptional({ description: 'Article reference', example: 'Article 42' })
  @IsString()
  @IsOptional()
  articleRef?: string;

  @ApiPropertyOptional({ description: 'Dahir number', example: '1-24-05' })
  @IsString()
  @IsOptional()
  dahirNumber?: string;

  @ApiPropertyOptional({ description: 'Bulletin number', example: 'BO 1234' })
  @IsString()
  @IsOptional()
  bulletinNumber?: string;

  @ApiPropertyOptional({ description: 'Language', enum: Locale, default: Locale.EN })
  @IsEnum(Locale)
  @IsOptional()
  language?: Locale;

  @ApiPropertyOptional({ description: 'Legal domain', enum: LegalDomain })
  @IsEnum(LegalDomain)
  @IsOptional()
  legalDomain?: LegalDomain;

  @ApiPropertyOptional({ description: 'Effective date', example: '2024-01-01' })
  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @ApiPropertyOptional({ description: 'Jurisdiction', enum: Jurisdiction, default: Jurisdiction.NATIONAL })
  @IsEnum(Jurisdiction)
  @IsOptional()
  jurisdiction?: Jurisdiction;

  @ApiPropertyOptional({ description: 'S3 storage URL', example: 'https://bucket.s3.amazonaws.com/doc.pdf' })
  @IsString()
  @IsOptional()
  s3Url?: string;
}
