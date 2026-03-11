import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketplace1769200000000 implements MigrationInterface {
  name = 'AddMarketplace1769200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create TemplateCategory enum
    await queryRunner.query(`
      CREATE TYPE "public"."marketplace_templates_category_enum" AS ENUM(
        'PROJECT_MANAGEMENT', 'SOFTWARE_DEV', 'MARKETING', 'DESIGN', 'HR', 'EDUCATION', 'FINANCE', 'OTHER'
      )
    `);

    // Create TemplateType enum
    await queryRunner.query(`
      CREATE TYPE "public"."marketplace_templates_type_enum" AS ENUM(
        'PROJECT', 'TASK', 'WORKFLOW'
      )
    `);

    // Create marketplace_templates table
    await queryRunner.query(`
      CREATE TABLE "marketplace_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying DEFAULT 'SYSTEM',
        "updated_by" character varying DEFAULT 'SYSTEM',
        "deleted_at" TIMESTAMP,
        "name" character varying NOT NULL,
        "description" text NOT NULL,
        "category" "public"."marketplace_templates_category_enum" NOT NULL DEFAULT 'OTHER',
        "type" "public"."marketplace_templates_type_enum" NOT NULL DEFAULT 'PROJECT',
        "thumbnail_url" character varying,
        "template_data" jsonb NOT NULL,
        "author_id" uuid,
        "workspace_id" uuid,
        "is_public" boolean NOT NULL DEFAULT true,
        "is_featured" boolean NOT NULL DEFAULT false,
        "install_count" integer NOT NULL DEFAULT 0,
        "rating" numeric(3,2) NOT NULL DEFAULT 0,
        "rating_count" integer NOT NULL DEFAULT 0,
        "tags" text[] NOT NULL DEFAULT '{}',
        "version" character varying NOT NULL DEFAULT '1.0.0',
        CONSTRAINT "PK_marketplace_templates" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for marketplace_templates
    await queryRunner.query(`CREATE INDEX "IDX_marketplace_templates_category" ON "marketplace_templates" ("category")`);
    await queryRunner.query(`CREATE INDEX "IDX_marketplace_templates_type" ON "marketplace_templates" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_marketplace_templates_author_id" ON "marketplace_templates" ("author_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_marketplace_templates_workspace_id" ON "marketplace_templates" ("workspace_id")`);

    // Add foreign keys for marketplace_templates
    await queryRunner.query(`
      ALTER TABLE "marketplace_templates"
        ADD CONSTRAINT "FK_marketplace_templates_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "marketplace_templates"
        ADD CONSTRAINT "FK_marketplace_templates_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Create template_reviews table
    await queryRunner.query(`
      CREATE TABLE "template_reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying DEFAULT 'SYSTEM',
        "updated_by" character varying DEFAULT 'SYSTEM',
        "deleted_at" TIMESTAMP,
        "template_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "rating" integer NOT NULL,
        "comment" text,
        CONSTRAINT "PK_template_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_template_reviews_template_user" UNIQUE ("template_id", "user_id")
      )
    `);

    // Create indexes for template_reviews
    await queryRunner.query(`CREATE INDEX "IDX_template_reviews_template_id" ON "template_reviews" ("template_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_template_reviews_user_id" ON "template_reviews" ("user_id")`);

    // Add foreign keys for template_reviews
    await queryRunner.query(`
      ALTER TABLE "template_reviews"
        ADD CONSTRAINT "FK_template_reviews_template" FOREIGN KEY ("template_id") REFERENCES "marketplace_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "template_reviews"
        ADD CONSTRAINT "FK_template_reviews_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "template_reviews" DROP CONSTRAINT "FK_template_reviews_user"`);
    await queryRunner.query(`ALTER TABLE "template_reviews" DROP CONSTRAINT "FK_template_reviews_template"`);
    await queryRunner.query(`DROP INDEX "IDX_template_reviews_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_template_reviews_template_id"`);
    await queryRunner.query(`DROP TABLE "template_reviews"`);

    await queryRunner.query(`ALTER TABLE "marketplace_templates" DROP CONSTRAINT "FK_marketplace_templates_workspace"`);
    await queryRunner.query(`ALTER TABLE "marketplace_templates" DROP CONSTRAINT "FK_marketplace_templates_author"`);
    await queryRunner.query(`DROP INDEX "IDX_marketplace_templates_workspace_id"`);
    await queryRunner.query(`DROP INDEX "IDX_marketplace_templates_author_id"`);
    await queryRunner.query(`DROP INDEX "IDX_marketplace_templates_type"`);
    await queryRunner.query(`DROP INDEX "IDX_marketplace_templates_category"`);
    await queryRunner.query(`DROP TABLE "marketplace_templates"`);

    await queryRunner.query(`DROP TYPE "public"."marketplace_templates_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."marketplace_templates_category_enum"`);
  }
}
