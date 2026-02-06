import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClosedReopenStatus1769145000000 implements MigrationInterface {
    name = 'AddClosedReopenStatus1769145000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."tasks_status_enum" ADD VALUE IF NOT EXISTS 'CLOSED'`);
        await queryRunner.query(`ALTER TYPE "public"."tasks_status_enum" ADD VALUE IF NOT EXISTS 'REOPEN'`);
        await queryRunner.query(`ALTER TYPE "public"."projects_status_enum" ADD VALUE IF NOT EXISTS 'CLOSED'`);
        await queryRunner.query(`ALTER TYPE "public"."projects_status_enum" ADD VALUE IF NOT EXISTS 'REOPEN'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL does not support removing values from enums directly.
        // To revert, you would need to create a new enum type without these values,
        // migrate all data, and swap the types. Skipping for safety.
    }

}
