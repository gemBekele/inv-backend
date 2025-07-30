import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShopSaleEntities1752612513991 implements MigrationInterface {
    name = 'AddShopSaleEntities1752612513991'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sales_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "quantity" integer NOT NULL, "unitPrice" numeric(10,2) NOT NULL, "total" numeric(10,2) NOT NULL, "salesId" uuid, "productId" uuid, CONSTRAINT "PK_534cb3df276d77c81b1234c02b5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."sales_paymenttype_enum" AS ENUM('cash', 'credit', 'debit', 'online')`);
        await queryRunner.query(`CREATE TYPE "public"."sales_status_enum" AS ENUM('pending', 'completed', 'cancelled', 'refunded')`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "totalAmount" numeric(10,2) NOT NULL, "taxAmount" numeric(10,2) NOT NULL, "advancePayment" numeric(10,2) NOT NULL DEFAULT '0', "remainingBalance" numeric(10,2) NOT NULL DEFAULT '0', "saleDate" date NOT NULL, "paymentType" "public"."sales_paymenttype_enum" NOT NULL, "status" "public"."sales_status_enum" NOT NULL DEFAULT 'pending', "note" character varying(255), "customerId" uuid, "warehouseId" uuid, CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shops" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, "location" character varying(255), "warehouseId" uuid, "companyId" uuid, CONSTRAINT "PK_3c6aaa6607d287de99815e60b96" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sales_items" ADD CONSTRAINT "FK_21e5378da63923ebbf3e19f0201" FOREIGN KEY ("salesId") REFERENCES "sales"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales_items" ADD CONSTRAINT "FK_22ff38e6b64c73d008e601d5c59" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_7680423341c3358404990c2fecf" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shops" ADD CONSTRAINT "FK_8f92dbc07e81c8be491d9316d15" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shops" ADD CONSTRAINT "FK_25e02016a81838ed10dd877c5cc" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shops" DROP CONSTRAINT "FK_25e02016a81838ed10dd877c5cc"`);
        await queryRunner.query(`ALTER TABLE "shops" DROP CONSTRAINT "FK_8f92dbc07e81c8be491d9316d15"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_7680423341c3358404990c2fecf"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_3a92cf6add00043cef9833db1cd"`);
        await queryRunner.query(`ALTER TABLE "sales_items" DROP CONSTRAINT "FK_22ff38e6b64c73d008e601d5c59"`);
        await queryRunner.query(`ALTER TABLE "sales_items" DROP CONSTRAINT "FK_21e5378da63923ebbf3e19f0201"`);
        await queryRunner.query(`DROP TABLE "shops"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`DROP TYPE "public"."sales_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sales_paymenttype_enum"`);
        await queryRunner.query(`DROP TABLE "sales_items"`);
    }

}
