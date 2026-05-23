import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRLSToCoreTables1774866000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users Table
    await queryRunner.query(`ALTER TABLE "users" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "users" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
        CREATE POLICY tenant_isolation_policy ON "users"
        FOR ALL
        USING (organization_id::text = current_setting('app.current_tenant_id', true));
    `);

    // Organizations Table (Organizations can only see themselves)
    await queryRunner.query(`ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "organizations" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
        CREATE POLICY tenant_isolation_policy ON "organizations"
        FOR ALL
        USING (id::text = current_setting('app.current_tenant_id', true));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON "organizations"`);
    await queryRunner.query(`ALTER TABLE "organizations" DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON "users"`);
    await queryRunner.query(`ALTER TABLE "users" DISABLE ROW LEVEL SECURITY`);
  }
}
