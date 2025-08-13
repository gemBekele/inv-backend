import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductLocation1755077225601 implements MigrationInterface {
    name = 'AddProductLocation1755077225601'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "shop_products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "stockQuantity" integer NOT NULL DEFAULT '0', "minStockLevel" integer NOT NULL DEFAULT '0', "salesQuantity" integer NOT NULL DEFAULT '0', "salesRevenue" numeric(10,2) NOT NULL DEFAULT '0', "lastSaleDate" date, "shopId" uuid, "productId" uuid, CONSTRAINT "UQ_51f059443ae0eb5eb6659d14f9a" UNIQUE ("shopId", "productId"), CONSTRAINT "PK_bc7b9a757fadb6a6b0e5cc4bf7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "shop_products" ADD CONSTRAINT "FK_98b764d1f5411357cb5d50b8bba" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shop_products" ADD CONSTRAINT "FK_ea91320cac7908867e288ac7a81" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shop_products" DROP CONSTRAINT "FK_ea91320cac7908867e288ac7a81"`);
        await queryRunner.query(`ALTER TABLE "shop_products" DROP CONSTRAINT "FK_98b764d1f5411357cb5d50b8bba"`);
        await queryRunner.query(`DROP TABLE "shop_products"`);
    }

}
