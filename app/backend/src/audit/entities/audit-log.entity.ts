import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { ActorType } from './enums/actor-type.enum';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: ActorType })
  actorType!: ActorType;

  /**
   * The UUID of the actor (User.id or ApiKey.id).
   * Nullable for SYSTEM actors which have no identity row.
   */
  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column()
  action!: string;

  @Column({ name: 'resource_type' })
  resourceType!: string;

  @Column({ name: 'resource_id', type: 'uuid' })
  resourceId!: string;

  @Column({ type: 'jsonb', nullable: true })
  diff!: Record<string, unknown> | null;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true })
  userAgent!: string | null;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
