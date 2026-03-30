import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Organization } from '../../organizations/entities/organization.entity';
import { Locale } from '../../projects/entities/enums/locale.enum';

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'full_name', type: 'varchar', nullable: true })
  fullName!: string | null;

  @Column({ unique: true })
  email!: string;

  @Exclude()
  @Column()
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role!: UserRole;

  @Column({ type: 'enum', enum: Locale, default: Locale.EN })
  locale!: Locale;

  @Column({ name: 'email_verified', default: false })
  emailVerified!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt!: Date;

  @ManyToOne(() => Organization, (org) => org.users, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  canAccess(resource: string): boolean {
    if (this.role === UserRole.OWNER || this.role === UserRole.ADMIN) {
      return true;
    }
    return this.isActive;
  }

  deactivate(): void {
    this.isActive = false;
  }
}
