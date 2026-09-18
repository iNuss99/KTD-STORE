import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoginAttemptsToUsers1700000000003 implements MigrationInterface {
  name = 'AddLoginAttemptsToUsers1700000000003';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "login_attempts" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMP WITH TIME ZONE NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "login_attempts"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "locked_until"`);
  }
}
