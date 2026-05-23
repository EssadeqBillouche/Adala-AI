import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Subscription } from '../../billing/entities/subscription.entity';
import { Locale } from '../../common/enums/locale.enum';

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

  @Column({ name: 'billing_email', type: 'varchar', nullable: true })
  billingEmail!: string | null;

  @Column({ type: 'enum', enum: TenantTier, default: TenantTier.FREE })
  tier!: TenantTier;

  @Column({ type: 'enum', enum: Locale, default: Locale.EN })
  locale!: Locale;

  @Column({ name: 'sso_enabled', default: false })
  ssoEnabled!: boolean;

  @Column({ name: 'max_seats', default: 5 })
  maxSeats!: number;

  @Column({ name: 'logo_url', type: 'varchar', nullable: true })
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
    return this.users.filter((u) => u.isActive === true);
  }

  getCreditBalance(): number {
    if (this.tier === TenantTier.FREE) return 1_000;
    if (this.tier === TenantTier.PRO) return 10_000;
    return 100_000; // ENTERPRISE
  }
}
