import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { TransactionType } from './enums/transaction-type.enum';

@Entity('credit_ledgers')
export class CreditLedger {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column()
  amount!: number;

  @Column({ name: 'balance_before' })
  balanceBefore!: number;

  @Column({ name: 'balance_after' })
  balanceAfter!: number;

  @Column({ type: 'varchar', nullable: true })
  reason!: string | null;

  @Column({ name: 'idempotency_key', unique: true })
  idempotencyKey!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  isDebit(): boolean {
    return this.type === TransactionType.SPEND || this.type === TransactionType.EXPIRE;
  }
}
