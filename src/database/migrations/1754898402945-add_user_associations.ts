import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserAssociations1754898402945 implements MigrationInterface {
    name = 'AddUserAssociations1754898402945'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "companyId" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "shopId" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "warehouseId" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_6f9395c9037632a31107c8a9e58" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_7680babafb8b9ca907bfbd142c5" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_66dcc8b80d6571a4edf537bff1e" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_66dcc8b80d6571a4edf537bff1e"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_7680babafb8b9ca907bfbd142c5"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_6f9395c9037632a31107c8a9e58"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "warehouseId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "shopId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "companyId"`);
    }

}
