import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, BeforeUpdate } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { UserRole } from './user.entity';
import { InviteStatus } from './enums/invite-status.enum';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ unique: true })
  token!: string;

  @Column({ type: 'enum', enum: InviteStatus, default: InviteStatus.PENDING })
  status!: InviteStatus;

  @Column({ name: 'expires_at' })
  expiresAt!: Date;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @BeforeUpdate()
  checkExpiration(): void {
    if (this.status === InviteStatus.PENDING && new Date() > this.expiresAt) {
      this.status = InviteStatus.EXPIRED;
    }
  }

  isExpired(): boolean {
    return this.status === InviteStatus.EXPIRED || new Date() > this.expiresAt;
  }

  accept(): void {
    if (this.isExpired()) {
      throw new Error('Invitation has expired');
    }
    this.status = InviteStatus.ACCEPTED;
  }
}
