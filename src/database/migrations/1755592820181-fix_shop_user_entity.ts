import { MigrationInterface, QueryRunner } from "typeorm";

export class FixShopUserEntity1755592820181 implements MigrationInterface {
    name = 'FixShopUserEntity1755592820181'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shops" ADD "ownerId" uuid`);
        await queryRunner.query(`ALTER TABLE "shops" ADD CONSTRAINT "FK_9f222a91f08322c9d08a1b443b8" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shops" DROP CONSTRAINT "FK_9f222a91f08322c9d08a1b443b8"`);
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "ownerId"`);
    }

}
