import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Project } from './project.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { ConvStatus } from './enums/conv-status.enum';
import { Locale } from './enums/locale.enum';
import { Message } from './message.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @Column({ type: 'enum', enum: Locale, default: Locale.EN })
  language!: Locale;

  @Column({ type: 'enum', enum: ConvStatus, default: ConvStatus.ACTIVE })
  status!: ConvStatus;

  @Column({ name: 'total_tokens_used', type: 'integer', default: 0 })
  totalTokensUsed!: number;

  @Column({ name: 'total_credits_used', type: 'integer', default: 0 })
  totalCreditsUsed!: number;

  @Column({ name: 'vector_thread_ids', type: 'uuid', array: true, default: '{}' })
  vectorThreadIds!: string[];

  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => Project, (project) => project.conversations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @OneToMany(() => Message, (message) => message.conversation, { cascade: true })
  messages!: Message[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  archive(): void {
    this.status = ConvStatus.ARCHIVED;
  }

  restore(): void {
    this.status = ConvStatus.ACTIVE;
  }

  getCreditsRemaining(): number {
    const maxCredits = this.organization?.tier === 'FREE' ? 1000 : this.organization?.tier === 'PRO' ? 10000 : 100000;
    return maxCredits - this.totalCreditsUsed;
  }
}
