import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Message } from './message.entity';
import { LegalSource } from './legal-source.entity';

@Entity('message_citations')
export class MessageCitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  rank!: number;

  @Column({ name: 'similarity_score', type: 'double precision' })
  similarityScore!: number;

  @Column({ name: 'chunk_index', type: 'integer' })
  chunkIndex!: number;

  @Column({ type: 'text' })
  excerpt!: string;

  @Column({ name: 'message_id' })
  messageId!: string;

  @ManyToOne(() => Message, (message) => message.citations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message!: Message;

  @Column({ name: 'legal_source_id' })
  legalSourceId!: string;

  @ManyToOne(() => LegalSource, (legalSource) => legalSource.citations)
  @JoinColumn({ name: 'legal_source_id' })
  legalSource!: LegalSource;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
