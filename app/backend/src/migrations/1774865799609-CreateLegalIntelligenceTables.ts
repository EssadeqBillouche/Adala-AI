import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLegalIntelligenceTables1774865799609 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "legal_domain_enum" AS ENUM ('CIVIL', 'PENAL', 'COMMERCIAL', 'FAMILY', 'ADMINISTRATIVE', 'LABOR')
    `);
    await queryRunner.query(`
      CREATE TYPE "locale_enum" AS ENUM ('AR', 'FR', 'EN')
    `);
    await queryRunner.query(`
      CREATE TYPE "conv_status_enum" AS ENUM ('ACTIVE', 'ARCHIVED', 'ERROR')
    `);
    await queryRunner.query(`
      CREATE TYPE "jurisdiction_enum" AS ENUM ('NATIONAL', 'REGIONAL')
    `);
    await queryRunner.query(`
      CREATE TYPE "message_role_enum" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM')
    `);
    await queryRunner.query(`
      CREATE TYPE "source_type_enum" AS ENUM ('DAHIR', 'CODE', 'JURISPRUDENCE', 'DOCTRINE', 'CIRCULAR')
    `);
    await queryRunner.query(`
      CREATE TYPE "embedding_status_enum" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED')
    `);

    await queryRunner.query(`
      ALTER TABLE "projects"
      ADD COLUMN IF NOT EXISTS "description" text,
      ADD COLUMN IF NOT EXISTS "legal_domain" "legal_domain_enum",
      ADD COLUMN IF NOT EXISTS "language" "locale_enum" DEFAULT 'EN'
    `);

    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "summary" text,
        "language" "locale_enum" NOT NULL DEFAULT 'EN',
        "status" "conv_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "total_tokens_used" integer NOT NULL DEFAULT 0,
        "total_credits_used" integer NOT NULL DEFAULT 0,
        "vector_thread_ids" uuid array NOT NULL DEFAULT '{}',
        "project_id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversations" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role" "message_role_enum" NOT NULL,
        "content" text NOT NULL,
        "tokens_in" integer,
        "tokens_out" integer,
        "latency_ms" integer,
        "rag_score" double precision,
        "citation_count" integer NOT NULL DEFAULT 0,
        "error_code" character varying,
        "metadata" jsonb,
        "conversation_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "legal_sources" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "file_name" character varying,
        "file_type" character varying,
        "source_type" "source_type_enum" NOT NULL,
        "article_ref" character varying,
        "dahir_number" character varying,
        "bulletin_number" character varying,
        "language" "locale_enum" NOT NULL DEFAULT 'EN',
        "legal_domain" "legal_domain_enum",
        "effective_date" date,
        "jurisdiction" "jurisdiction_enum" NOT NULL DEFAULT 'NATIONAL',
        "s3_url" character varying,
        "embedding_status" "embedding_status_enum" NOT NULL DEFAULT 'PENDING',
        "chunk_count" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "organization_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_legal_sources" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "message_citations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "rank" integer NOT NULL,
        "similarity_score" double precision NOT NULL,
        "chunk_index" integer NOT NULL,
        "excerpt" text NOT NULL,
        "message_id" uuid NOT NULL,
        "legal_source_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_message_citations" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "conversations"
      ADD CONSTRAINT "FK_conversations_project"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "conversations"
      ADD CONSTRAINT "FK_conversations_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD CONSTRAINT "FK_messages_conversation"
      FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "legal_sources"
      ADD CONSTRAINT "FK_legal_sources_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "message_citations"
      ADD CONSTRAINT "FK_message_citations_message"
      FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "message_citations"
      ADD CONSTRAINT "FK_message_citations_legal_source"
      FOREIGN KEY ("legal_source_id") REFERENCES "legal_sources"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "conversations" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_policy ON "conversations"
      FOR ALL
      USING (organization_id::text = current_setting('app.current_tenant_id', true))
    `);

    await queryRunner.query(`ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "messages" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_policy ON "messages"
      FOR ALL
      USING (
        conversation_id IN (
          SELECT id FROM "conversations" WHERE organization_id::text = current_setting('app.current_tenant_id', true)
        )
      )
    `);

    await queryRunner.query(`ALTER TABLE "legal_sources" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "legal_sources" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_policy ON "legal_sources"
      FOR ALL
      USING (organization_id::text = current_setting('app.current_tenant_id', true))
    `);

    await queryRunner.query(`ALTER TABLE "message_citations" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "message_citations" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_policy ON "message_citations"
      FOR ALL
      USING (
        message_id IN (
          SELECT id FROM "messages" WHERE conversation_id IN (
            SELECT id FROM "conversations" WHERE organization_id::text = current_setting('app.current_tenant_id', true)
          )
        )
        OR
        legal_source_id IN (
          SELECT id FROM "legal_sources" WHERE organization_id::text = current_setting('app.current_tenant_id', true)
        )
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON "message_citations"`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON "legal_sources"`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON "messages"`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON "conversations"`);

    await queryRunner.query(`ALTER TABLE "message_citations" DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "legal_sources" DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "messages" DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "conversations" DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`ALTER TABLE "message_citations" DROP CONSTRAINT "FK_message_citations_legal_source"`);
    await queryRunner.query(`ALTER TABLE "message_citations" DROP CONSTRAINT "FK_message_citations_message"`);
    await queryRunner.query(`ALTER TABLE "legal_sources" DROP CONSTRAINT "FK_legal_sources_organization"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_conversation"`);
    await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_conversations_organization"`);
    await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_conversations_project"`);

    await queryRunner.query(`DROP TABLE "message_citations"`);
    await queryRunner.query(`DROP TABLE "legal_sources"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "conversations"`);

    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "language"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "legal_domain"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "description"`);

    await queryRunner.query(`DROP TYPE "embedding_status_enum"`);
    await queryRunner.query(`DROP TYPE "source_type_enum"`);
    await queryRunner.query(`DROP TYPE "message_role_enum"`);
    await queryRunner.query(`DROP TYPE "jurisdiction_enum"`);
    await queryRunner.query(`DROP TYPE "conv_status_enum"`);
    await queryRunner.query(`DROP TYPE "locale_enum"`);
    await queryRunner.query(`DROP TYPE "legal_domain_enum"`);
  }
}
