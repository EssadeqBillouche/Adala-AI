import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvitationsTable1774865941032 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "invite_status_enum" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED')
    `);

    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "role" "user_role_enum" NOT NULL,
        "token" character varying NOT NULL,
        "status" "invite_status_enum" NOT NULL DEFAULT 'PENDING',
        "expires_at" TIMESTAMP NOT NULL,
        "organization_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invitations" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_invitations_token" ON "invitations" ("token")`);

    await queryRunner.query(`
      ALTER TABLE "invitations"
      ADD CONSTRAINT "FK_invitations_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "invitations" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_policy ON "invitations"
      FOR ALL
      USING (organization_id::text = current_setting('app.current_tenant_id', true))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON "invitations"`);
    await queryRunner.query(`ALTER TABLE "invitations" DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_organization"`);
    await queryRunner.query(`DROP INDEX "IDX_invitations_token"`);
    await queryRunner.query(`DROP TABLE "invitations"`);

    await queryRunner.query(`DROP TYPE "invite_status_enum"`);
  }
}
