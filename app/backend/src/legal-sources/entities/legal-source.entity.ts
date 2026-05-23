import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { SourceType } from './enums/source-type.enum';
import { EmbeddingStatus } from './enums/embedding-status.enum';
import { LegalDomain } from './enums/legal-domain.enum';
import { Locale } from '../../common/enums/locale.enum';
import { Jurisdiction } from './enums/jurisdiction.enum';
import { MessageCitation } from '../../conversations/entities/message-citation.entity';

@Entity('legal_sources')
export class LegalSource {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ name: 'file_name', type: 'varchar', nullable: true })
  fileName!: string | null;

  @Column({ name: 'file_type', type: 'varchar', nullable: true })
  fileType!: string | null;

  @Column({ type: 'enum', enum: SourceType })
  sourceType!: SourceType;

  @Column({ name: 'article_ref', type: 'varchar', nullable: true })
  articleRef!: string | null;

  @Column({ name: 'dahir_number', type: 'varchar', nullable: true })
  dahirNumber!: string | null;

  @Column({ name: 'bulletin_number', type: 'varchar', nullable: true })
  bulletinNumber!: string | null;

  @Column({ type: 'enum', enum: Locale, default: Locale.EN })
  language!: Locale;

  @Column({ type: 'enum', enum: LegalDomain, nullable: true })
  legalDomain!: LegalDomain | null;

  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate!: Date | null;

  @Column({ type: 'enum', enum: Jurisdiction, default: Jurisdiction.NATIONAL })
  jurisdiction!: Jurisdiction;

  @Column({ name: 's3_url', type: 'varchar', nullable: true })
  s3Url!: string | null;

  @Column({ type: 'enum', enum: EmbeddingStatus, default: EmbeddingStatus.PENDING })
  embeddingStatus!: EmbeddingStatus;

  @Column({ name: 'chunk_count', default: 0 })
  chunkCount!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @OneToMany(() => MessageCitation, (citation) => citation.legalSource)
  citations!: MessageCitation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  isAbrogated(): boolean {
    return !this.isActive;
  }

  isEmbedded(): boolean {
    return this.embeddingStatus === EmbeddingStatus.DONE;
  }
}
