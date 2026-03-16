import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRLSToProjects1773674488876 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE "projects" FORCE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
        CREATE POLICY tenant_isolation_policy ON "projects"
        FOR ALL
        USING (organization_id::text = current_setting('app.current_tenant_id', true));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON "projects";`);
    await queryRunner.query(`ALTER TABLE "projects" DISABLE ROW LEVEL SECURITY;`);
  }
}
