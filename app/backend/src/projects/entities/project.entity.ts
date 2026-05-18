import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Conversation } from './conversation.entity';
import { LegalDomain } from './enums/legal-domain.enum';
import { Locale } from '../../common/enums/locale.enum';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: LegalDomain, nullable: true })
  legalDomain!: LegalDomain | null;

  @Column({ type: 'enum', enum: Locale, default: Locale.EN })
  language!: Locale;

  @Column({ default: false })
  isArchived!: boolean;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @OneToMany(() => Conversation, (conversation) => conversation.project)
  conversations!: Conversation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  archive(): void {
    this.isArchived = true;
  }

  restore(): void {
    this.isArchived = false;
  }
}
