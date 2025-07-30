import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCollectionsModule1753903628762 implements MigrationInterface {
    name = 'AddCollectionsModule1753903628762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "branches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, "address" character varying(255) NOT NULL, "phoneNumber" character varying(20), "email" character varying(255), "manager" character varying(255), "description" text, "isActive" boolean NOT NULL DEFAULT true, "metadata" json, CONSTRAINT "PK_7f37d3b42defea97f1df0d19535" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8387ed27b3d4ca53ec3fc7b029" ON "branches" ("name") `);
        await queryRunner.query(`CREATE TYPE "public"."suppliers_status_enum" AS ENUM('active', 'inactive', 'blacklisted')`);
        await queryRunner.query(`CREATE TABLE "suppliers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, "contact" character varying(20) NOT NULL, "email" character varying(255), "address" character varying(255), "contactPerson" character varying(255), "taxNumber" character varying(100), "description" text, "status" "public"."suppliers_status_enum" NOT NULL DEFAULT 'active', "creditLimit" numeric(10,2) NOT NULL DEFAULT '0', "paymentTermsDays" integer NOT NULL DEFAULT '30', "bankDetails" json, "metadata" json, CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e9739cd52e8a233dcc1510857a" ON "suppliers" ("email") WHERE email IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5b5720d9645cee7396595a16c9" ON "suppliers" ("name") `);
        await queryRunner.query(`CREATE TABLE "product_groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, "description" text, "code" character varying(10), "isActive" boolean NOT NULL DEFAULT true, "defaultCommissionRate" numeric(5,2) NOT NULL DEFAULT '0', "defaultTaxRate" numeric(5,2) NOT NULL DEFAULT '0', "metadata" json, CONSTRAINT "PK_bccc8805f3453d0cce77c1beedb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_68e571537431790229b8a3a596" ON "product_groups" ("name") `);
        await queryRunner.query(`CREATE TABLE "product_group_products" ("group_id" uuid NOT NULL, "product_id" uuid NOT NULL, CONSTRAINT "PK_ed0dfe10b9c036720c00e0901b1" PRIMARY KEY ("group_id", "product_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_eeef158e27f158b19fa4e5bc3b" ON "product_group_products" ("group_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_61d25794e7ca098f6ba9593e23" ON "product_group_products" ("product_id") `);
        await queryRunner.query(`ALTER TABLE "sales" ADD "branch_id" uuid`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_236f3154522de80a98f87c66b84" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_group_products" ADD CONSTRAINT "FK_eeef158e27f158b19fa4e5bc3ba" FOREIGN KEY ("group_id") REFERENCES "product_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "product_group_products" ADD CONSTRAINT "FK_61d25794e7ca098f6ba9593e234" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_group_products" DROP CONSTRAINT "FK_61d25794e7ca098f6ba9593e234"`);
        await queryRunner.query(`ALTER TABLE "product_group_products" DROP CONSTRAINT "FK_eeef158e27f158b19fa4e5bc3ba"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_236f3154522de80a98f87c66b84"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "branch_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_61d25794e7ca098f6ba9593e23"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eeef158e27f158b19fa4e5bc3b"`);
        await queryRunner.query(`DROP TABLE "product_group_products"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_68e571537431790229b8a3a596"`);
        await queryRunner.query(`DROP TABLE "product_groups"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5b5720d9645cee7396595a16c9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9739cd52e8a233dcc1510857a"`);
        await queryRunner.query(`DROP TABLE "suppliers"`);
        await queryRunner.query(`DROP TYPE "public"."suppliers_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8387ed27b3d4ca53ec3fc7b029"`);
        await queryRunner.query(`DROP TABLE "branches"`);
    }

}
