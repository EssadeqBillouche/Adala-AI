import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { SubStatus } from './enums/sub-status.enum';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'stripe_subscription_id', unique: true })
  stripeSubscriptionId!: string;

  @Column({ name: 'stripe_customer_id' })
  stripeCustomerId!: string;

  @Column({ name: 'stripe_price_id' })
  stripePriceId!: string;

  @Column({ type: 'enum', enum: SubStatus, default: SubStatus.ACTIVE })
  status!: SubStatus;

  @Column({ name: 'monthly_credits_alloc', default: 0 })
  monthlyCreditsAlloc!: number;

  @Column({ name: 'current_period_start', type: 'timestamp' })
  currentPeriodStart!: Date;

  @Column({ name: 'current_period_end', type: 'timestamp' })
  currentPeriodEnd!: Date;

  @Column({ name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd!: boolean;

  @Column({ name: 'trial_ends_at', type: 'timestamp', nullable: true })
  trialEndsAt!: Date | null;

  @Column({ name: 'organization_id', unique: true })
  organizationId!: string;

  @OneToOne(() => Organization, (org) => org.subscription)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  isActive(): boolean {
    return this.status === SubStatus.ACTIVE || this.status === SubStatus.TRIALING;
  }

  daysRemaining(): number {
    if (!this.currentPeriodEnd) return 0;
    const now = new Date();
    return Math.max(0, Math.ceil((this.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }
}
