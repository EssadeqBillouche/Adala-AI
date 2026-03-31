import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNameColumnsToUsers1711839600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "first_name" varchar NULL,
      ADD COLUMN IF NOT EXISTS "last_name" varchar NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "first_name",
      DROP COLUMN IF EXISTS "last_name"
    `);
  }
}
