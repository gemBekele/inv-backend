import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompany1752244977048 implements MigrationInterface {
    name = 'AddCompany1752244977048'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, "address" character varying(255) NOT NULL, "phoneNumber" character varying(20), "email" character varying(255), "description" text, CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "warehouses" ADD "companyId" uuid`);
        await queryRunner.query(`ALTER TABLE "warehouses" ADD CONSTRAINT "FK_317f82e3b199a7c6015ce1aff95" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouses" DROP CONSTRAINT "FK_317f82e3b199a7c6015ce1aff95"`);
        await queryRunner.query(`ALTER TABLE "warehouses" DROP COLUMN "companyId"`);
        await queryRunner.query(`DROP TABLE "companies"`);
    }

}
