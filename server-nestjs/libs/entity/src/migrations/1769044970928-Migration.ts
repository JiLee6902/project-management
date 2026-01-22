import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1769044970928 implements MigrationInterface {
    name = 'Migration1769044970928'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "guest_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying DEFAULT 'SYSTEM', "updated_by" character varying DEFAULT 'SYSTEM', "deleted_at" TIMESTAMP, "ip_address" character varying NOT NULL, "device_fingerprint" character varying, "user_id" uuid NOT NULL, "expires_at" TIMESTAMP NOT NULL, "login_count" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_7c077389b040139ae9487c1b03e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3e49f109052f829e3341f2ec33" ON "guest_sessions" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_3c8cf61e71f31077171be9b70e" ON "guest_sessions" ("ip_address") `);
        await queryRunner.query(`CREATE INDEX "IDX_490275e79cfa6565ae4f9987ee" ON "guest_sessions" ("device_fingerprint") `);
        await queryRunner.query(`ALTER TABLE "guest_sessions" ADD CONSTRAINT "FK_ac427886a0f8018bba5da1815c3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "guest_sessions" DROP CONSTRAINT "FK_ac427886a0f8018bba5da1815c3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_490275e79cfa6565ae4f9987ee"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3c8cf61e71f31077171be9b70e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3e49f109052f829e3341f2ec33"`);
        await queryRunner.query(`DROP TABLE "guest_sessions"`);
    }

}
