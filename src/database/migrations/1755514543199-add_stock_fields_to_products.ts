import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStockFieldsToProducts1755514543199 implements MigrationInterface {
    name = 'AddStockFieldsToProducts1755514543199'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "stockQuantity" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "minStockLevel" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "minStockLevel"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "stockQuantity"`);
    }

}
