import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedByToProducts1755515094982 implements MigrationInterface {
    name = 'AddCreatedByToProducts1755515094982'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "createdById" uuid`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_de1043dff8f68e83a20480b00f7" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_de1043dff8f68e83a20480b00f7"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "createdById"`);
    }

}
