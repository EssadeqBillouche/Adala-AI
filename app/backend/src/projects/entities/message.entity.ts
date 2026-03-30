import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Conversation } from './conversation.entity';
import { MessageRole } from './enums/message-role.enum';
import { MessageCitation } from './message-citation.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: MessageRole })
  role!: MessageRole;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'tokens_in', nullable: true })
  tokensIn!: number | null;

  @Column({ name: 'tokens_out', nullable: true })
  tokensOut!: number | null;

  @Column({ name: 'latency_ms', nullable: true })
  latencyMs!: number | null;

  @Column({ name: 'rag_score', type: 'double precision', nullable: true })
  ragScore!: number | null;

  @Column({ name: 'citation_count', default: 0 })
  citationCount!: number;

  @Column({ name: 'error_code', nullable: true })
  errorCode!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ name: 'conversation_id' })
  conversationId!: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @OneToMany(() => MessageCitation, (citation) => citation.message)
  citations!: MessageCitation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  isFromAssistant(): boolean {
    return this.role === MessageRole.ASSISTANT;
  }

  hasCitations(): boolean {
    return this.citationCount > 0;
  }
}
