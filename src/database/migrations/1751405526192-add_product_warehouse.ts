import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductWarehouse1751405526192 implements MigrationInterface {
    name = 'AddProductWarehouse1751405526192'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."products_type_enum" AS ENUM('product', 'service')`);
        await queryRunner.query(`CREATE TYPE "public"."products_status_enum" AS ENUM('available', 'unavailable', 'discontinued')`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "type" "public"."products_type_enum" NOT NULL, "name" character varying(255) NOT NULL, "description" text, "sku" character varying(100) NOT NULL, "barcode" character varying(100), "category" character varying(100) NOT NULL, "unit" character varying(50) NOT NULL, "price" numeric(10,2) NOT NULL, "cost" numeric(10,2) NOT NULL DEFAULT '0', "expiryDate" date, "status" "public"."products_status_enum" NOT NULL DEFAULT 'available', "metadata" json, "imageUrl" text, "taxRate" numeric(5,2) NOT NULL DEFAULT '0', "trackStock" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327" UNIQUE ("sku"), CONSTRAINT "UQ_adfc522baf9d9b19cd7d9461b7e" UNIQUE ("barcode"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_66f8d4eb79094ca848de5be70e" ON "products" ("barcode") WHERE barcode IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c44ac33a05b144dd0d9ddcf932" ON "products" ("sku") `);
        await queryRunner.query(`CREATE TABLE "warehouse_products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "stockQuantity" integer NOT NULL DEFAULT '0', "minStockLevel" integer NOT NULL DEFAULT '0', "salesQuantity" integer NOT NULL DEFAULT '0', "salesRevenue" numeric(10,2) NOT NULL DEFAULT '0', "lastSaleDate" date, "warehouseId" uuid, "productId" uuid, CONSTRAINT "UQ_a1b922196921ddd75d1b0f27414" UNIQUE ("warehouseId", "productId"), CONSTRAINT "PK_64fcddc30222be61dc0ef1664c5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "warehouses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, "location" text, CONSTRAINT "PK_56ae21ee2432b2270b48867e4be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "warehouse_products" ADD CONSTRAINT "FK_cacfb485dd2cb813e52cd43815d" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_products" ADD CONSTRAINT "FK_0f7f3dea02ab939646325ece974" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_products" DROP CONSTRAINT "FK_0f7f3dea02ab939646325ece974"`);
        await queryRunner.query(`ALTER TABLE "warehouse_products" DROP CONSTRAINT "FK_cacfb485dd2cb813e52cd43815d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "warehouses"`);
        await queryRunner.query(`DROP TABLE "warehouse_products"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c44ac33a05b144dd0d9ddcf932"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_66f8d4eb79094ca848de5be70e"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."products_type_enum"`);
    }

}
