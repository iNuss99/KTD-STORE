import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColorToProductImages1700000000001 implements MigrationInterface {
  name = 'AddColorToProductImages1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_images" 
      ADD COLUMN IF NOT EXISTS "color_id" uuid REFERENCES "colors"("id") ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_images" 
      DROP COLUMN IF EXISTS "color_id";
    `);
  }
}
