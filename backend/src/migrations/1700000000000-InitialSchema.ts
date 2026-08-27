import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. PostgreSQL Extensions
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);

    // 1. Users & RBAC
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(255) UNIQUE NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "full_name" varchar(255) NOT NULL,
        "phone_number" varchar(50),
        "role" varchar(50) DEFAULT 'CUSTOMER',
        "is_active" boolean DEFAULT true,
        "refresh_token_hash" varchar(255),
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(100) UNIQUE NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "module" varchar(100) NOT NULL
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "role" varchar(50) NOT NULL,
        "permission_code" varchar(100) NOT NULL,
        CONSTRAINT "UQ_role_permission" UNIQUE ("role", "permission_code")
      );
    `);

    // 2. Catalog & Products
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "slug" varchar(255) UNIQUE NOT NULL,
        "parent_id" uuid,
        "image_url" text,
        "is_active" boolean DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "brands" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "slug" varchar(255) UNIQUE NOT NULL,
        "code" varchar(50) UNIQUE,
        "logo_url" text,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sizes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(50) NOT NULL,
        "code" varchar(20) UNIQUE NOT NULL
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "colors" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(50) NOT NULL,
        "code" varchar(20) UNIQUE NOT NULL,
        "hex_code" varchar(10)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "code" varchar(100) UNIQUE NOT NULL,
        "slug" varchar(255) UNIQUE NOT NULL,
        "description" text,
        "brand_id" uuid REFERENCES "brands"("id") ON DELETE SET NULL,
        "category_id" uuid REFERENCES "categories"("id") ON DELETE SET NULL,
        "base_price" decimal(12,2) NOT NULL,
        "is_active" boolean DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_images" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "product_id" uuid REFERENCES "products"("id") ON DELETE CASCADE,
        "url" text NOT NULL,
        "alt_text" varchar(255),
        "sort_order" integer DEFAULT 0
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_variants" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "product_id" uuid REFERENCES "products"("id") ON DELETE CASCADE,
        "size_id" uuid REFERENCES "sizes"("id") ON DELETE RESTRICT,
        "color_id" uuid REFERENCES "colors"("id") ON DELETE RESTRICT,
        "sku" varchar(150) UNIQUE NOT NULL,
        "price_override" decimal(12,2),
        "stock_quantity" integer DEFAULT 0,
        "version" integer DEFAULT 1,
        "is_active" boolean DEFAULT true,
        CONSTRAINT "UQ_product_size_color" UNIQUE ("product_id", "size_id", "color_id")
      );
    `);

    // 3. Addresses & Cart
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "addresses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
        "receiver_name" varchar(255) NOT NULL,
        "phone_number" varchar(50) NOT NULL,
        "address_line" text NOT NULL,
        "ward" varchar(100),
        "district" varchar(100),
        "city" varchar(100),
        "is_default" boolean DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "carts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cart_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "cart_id" uuid REFERENCES "carts"("id") ON DELETE CASCADE,
        "variant_id" uuid REFERENCES "product_variants"("id") ON DELETE CASCADE,
        "quantity" integer DEFAULT 1,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT "UQ_cart_variant" UNIQUE ("cart_id", "variant_id")
      );
    `);

    // 4. Discounts & Orders
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "discounts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(50) UNIQUE NOT NULL,
        "name" varchar(255) NOT NULL,
        "type" varchar(20) NOT NULL, -- PERCENTAGE, FIXED_AMOUNT
        "value" decimal(12,2) NOT NULL,
        "max_discount_amount" decimal(12,2),
        "min_order_amount" decimal(12,2) DEFAULT 0,
        "max_uses" integer,
        "used_count" integer DEFAULT 0,
        "valid_from" TIMESTAMP WITH TIME ZONE,
        "valid_to" TIMESTAMP WITH TIME ZONE,
        "is_active" boolean DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "discount_scopes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "discount_id" uuid REFERENCES "discounts"("id") ON DELETE CASCADE,
        "category_id" uuid REFERENCES "categories"("id") ON DELETE CASCADE,
        "brand_id" uuid REFERENCES "brands"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_number" varchar(50) UNIQUE NOT NULL,
        "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "status" varchar(50) DEFAULT 'PENDING',
        "subtotal" decimal(12,2) NOT NULL,
        "discount_amount" decimal(12,2) DEFAULT 0,
        "shipping_fee" decimal(12,2) DEFAULT 0,
        "total_amount" decimal(12,2) NOT NULL,
        "shipping_snapshot" jsonb NOT NULL,
        "discount_code" varchar(50),
        "notes" text,
        "delivered_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" uuid REFERENCES "orders"("id") ON DELETE CASCADE,
        "variant_id" uuid REFERENCES "product_variants"("id") ON DELETE SET NULL,
        "product_name" varchar(255) NOT NULL,
        "size_name" varchar(50) NOT NULL,
        "color_name" varchar(50) NOT NULL,
        "sku" varchar(150) NOT NULL,
        "quantity" integer NOT NULL,
        "unit_price" decimal(12,2) NOT NULL,
        "total_price" decimal(12,2) NOT NULL
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" uuid REFERENCES "orders"("id") ON DELETE CASCADE,
        "payment_method" varchar(50) NOT NULL, -- COD, BANK_TRANSFER, VNPAY, MOMO
        "status" varchar(50) DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED, REFUNDED
        "amount" decimal(12,2) NOT NULL,
        "transaction_code" varchar(100),
        "paid_at" TIMESTAMP WITH TIME ZONE,
        "confirmed_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "refund_amount" decimal(12,2),
        "refunded_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "return_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" uuid REFERENCES "orders"("id") ON DELETE CASCADE,
        "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "reason" text NOT NULL,
        "status" varchar(50) DEFAULT 'REQUESTED', -- REQUESTED, APPROVED, REJECTED, RECEIVED, REFUNDED
        "admin_notes" text,
        "processed_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    // 5. Reviews, Notifications, Wishlists, Audit Logs, System Configs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reviews" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
        "product_id" uuid REFERENCES "products"("id") ON DELETE CASCADE,
        "order_id" uuid REFERENCES "orders"("id") ON DELETE CASCADE,
        "rating" integer NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
        "comment" text,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT "UQ_user_product_review" UNIQUE ("user_id", "product_id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
        "type" varchar(50) NOT NULL,
        "content" text NOT NULL,
        "metadata" jsonb,
        "is_read" boolean DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wishlist_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
        "product_id" uuid REFERENCES "products"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT "UQ_user_wishlist_product" UNIQUE ("user_id", "product_id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "action" varchar(100) NOT NULL,
        "entity" varchar(100) NOT NULL,
        "entity_id" varchar(100),
        "details" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "system_configs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "key" varchar(100) UNIQUE NOT NULL,
        "value" text NOT NULL,
        "description" text,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "system_configs" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wishlist_items" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "return_requests" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "discount_scopes" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "discounts" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cart_items" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "carts" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "addresses" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_variants" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_images" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "colors" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sizes" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "brands" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE;`);
  }
}
