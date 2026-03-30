import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Subscription } from './subscription.entity';
import { Locale } from '../../projects/entities/enums/locale.enum';

export enum TenantTier {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ name: 'billing_email', nullable: true })
  billingEmail!: string | null;

  @Column({ type: 'enum', enum: TenantTier, default: TenantTier.FREE })
  tier!: TenantTier;

  @Column({ type: 'enum', enum: Locale, default: Locale.EN })
  locale!: Locale;

  @Column({ name: 'sso_enabled', default: false })
  ssoEnabled!: boolean;

  @Column({ name: 'max_seats', default: 5 })
  maxSeats!: number;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => User, (user) => user.organization)
  users!: User[];

  @OneToOne(() => Subscription, (subscription) => subscription.organization)
  subscription!: Subscription;

  getActiveUsers(): User[] {
    return this.users.filter((u) => u.isActive !== false);
  }

  getCreditBalance(): number {
    const baseCredits = this.tier === 'FREE' ? 1000 : this.tier === 'PRO' ? 10000 : 100000;
    return baseCredits;
  }
}
