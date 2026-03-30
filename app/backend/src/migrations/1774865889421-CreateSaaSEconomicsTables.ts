import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSaaSEconomicsTables1774865889421 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "transaction_type_enum" AS ENUM ('TOPUP', 'SPEND', 'REFUND', 'EXPIRE', 'BONUS')
    `);
    await queryRunner.query(`
      CREATE TYPE "sub_status_enum" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED')
    `);
    await queryRunner.query(`
      CREATE TYPE "actor_type_enum" AS ENUM ('USER', 'SYSTEM', 'API_KEY')
    `);

    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "slug" character varying,
      ADD COLUMN IF NOT EXISTS "billing_email" character varying,
      ADD COLUMN IF NOT EXISTS "locale" "locale_enum" DEFAULT 'EN',
      ADD COLUMN IF NOT EXISTS "sso_enabled" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "max_seats" integer DEFAULT 5,
      ADD COLUMN IF NOT EXISTS "logo_url" character varying,
      ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now()
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_organizations_slug" ON "organizations" ("slug")`);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "full_name" character varying,
      ADD COLUMN IF NOT EXISTS "locale" "locale_enum" DEFAULT 'EN',
      ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true
    `);
    await queryRunner.query(`ALTER TYPE "user_role_enum" ADD VALUE IF NOT EXISTS 'VIEWER'`);

    await queryRunner.query(`
      CREATE TABLE "credit_ledgers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "transaction_type_enum" NOT NULL,
        "amount" integer NOT NULL,
        "balance_before" integer NOT NULL,
        "balance_after" integer NOT NULL,
        "reason" character varying,
        "idempotency_key" character varying NOT NULL,
        "organization_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_credit_ledgers" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_credit_ledgers_idempotency_key" ON "credit_ledgers" ("idempotency_key")`);

    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "stripe_subscription_id" character varying NOT NULL,
        "stripe_customer_id" character varying NOT NULL,
        "stripe_price_id" character varying NOT NULL,
        "status" "sub_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "monthly_credits_alloc" integer NOT NULL DEFAULT 0,
        "current_period_start" TIMESTAMP NOT NULL,
        "current_period_end" TIMESTAMP NOT NULL,
        "cancel_at_period_end" boolean NOT NULL DEFAULT false,
        "trial_ends_at" TIMESTAMP,
        "organization_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_subscriptions_stripe_subscription_id" ON "subscriptions" ("stripe_subscription_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_subscriptions_organization_id" ON "subscriptions" ("organization_id")`);

    await queryRunner.query(`
      CREATE TABLE "api_keys" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "key_prefix" character varying NOT NULL,
        "key_hash" character varying NOT NULL,
        "scopes" text array NOT NULL DEFAULT '{}',
        "rate_limit" integer NOT NULL DEFAULT 100,
        "expires_at" TIMESTAMP,
        "last_used_at" TIMESTAMP,
        "is_revoked" boolean NOT NULL DEFAULT false,
        "organization_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_api_keys" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actor_type" "actor_type_enum" NOT NULL,
        "action" character varying NOT NULL,
        "resource_type" character varying NOT NULL,
        "resource_id" uuid NOT NULL,
        "diff" jsonb,
        "ip_address" character varying,
        "user_agent" character varying,
        "organization_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "credit_ledgers"
      ADD CONSTRAINT "FK_credit_ledgers_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD CONSTRAINT "FK_subscriptions_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "api_keys"
      ADD CONSTRAINT "FK_api_keys_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD CONSTRAINT "FK_audit_logs_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`ALTER TABLE "credit_ledgers" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "credit_ledgers" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_policy ON "credit_ledgers"
      FOR ALL
      USING (organization_id::text = current_setting('app.current_tenant_id', true))
    `);

    await queryRunner.query(`ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "subscriptions" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_policy ON "subscriptions"
      FOR ALL
      USING (organization_id::text = current_setting('app.current_tenant_id', true))
    `);

    await queryRunner.query(`ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "api_keys" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_policy ON "api_keys"
      FOR ALL
      USING (organization_id::text = current_setting('app.current_tenant_id', true))
    `);

    await queryRunner.query(`ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_policy ON "audit_logs"
      FOR ALL
      USING (organization_id::text = current_setting('app.current_tenant_id', true))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON "audit_logs"`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON "api_keys"`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON "subscriptions"`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON "credit_ledgers"`);

    await queryRunner.query(`ALTER TABLE "audit_logs" DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "api_keys" DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "credit_ledgers" DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_organization"`);
    await queryRunner.query(`ALTER TABLE "api_keys" DROP CONSTRAINT "FK_api_keys_organization"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_organization"`);
    await queryRunner.query(`ALTER TABLE "credit_ledgers" DROP CONSTRAINT "FK_credit_ledgers_organization"`);

    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "api_keys"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TABLE "credit_ledgers"`);

    await queryRunner.query(`DROP INDEX "IDX_subscriptions_organization_id"`);
    await queryRunner.query(`DROP INDEX "IDX_subscriptions_stripe_subscription_id"`);
    await queryRunner.query(`DROP INDEX "IDX_credit_ledgers_idempotency_key"`);
    await queryRunner.query(`DROP INDEX "IDX_organizations_slug"`);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_active"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "locale"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "full_name"`);

    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN IF EXISTS "updated_at"`);
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN IF EXISTS "logo_url"`);
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN IF EXISTS "max_seats"`);
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN IF EXISTS "sso_enabled"`);
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN IF EXISTS "locale"`);
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN IF EXISTS "billing_email"`);
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN IF EXISTS "slug"`);

    await queryRunner.query(`DROP TYPE "actor_type_enum"`);
    await queryRunner.query(`DROP TYPE "sub_status_enum"`);
    await queryRunner.query(`DROP TYPE "transaction_type_enum"`);
  }
}
