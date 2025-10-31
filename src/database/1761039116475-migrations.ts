import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1761039116475 implements MigrationInterface {
    name = 'Migrations1761039116475'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "branches" DROP CONSTRAINT "FK_a35729a94e7280cbebaaa541a20"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT "FK_a16f3c2e9b291abc6790e9822ae"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8387ed27b3d4ca53ec3fc7b029"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9739cd52e8a233dcc1510857a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5b5720d9645cee7396595a16c9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b2beba6a393519038d64b12ed"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c1a78b27ce1426491f175e034"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_85f92bfee8f136fab50cc3feb7"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "companyId"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "emergencyContact"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "companyId"`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "companyId" uuid`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "emergencyContact" json`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "companyId" uuid`);
        await queryRunner.query(`ALTER TABLE "transfers" ADD "deliveredDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "transfers" ADD "acceptedDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "transfers" ADD "deliveredById" uuid`);
        await queryRunner.query(`ALTER TABLE "transfers" ADD "acceptedById" uuid`);
        await queryRunner.query(`ALTER TYPE "public"."suppliers_status_enum" RENAME TO "suppliers_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."suppliers_status_enum" AS ENUM('active', 'inactive', 'blacklisted', 'pending_approval', 'suspended')`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" TYPE "public"."suppliers_status_enum" USING "status"::"text"::"public"."suppliers_status_enum"`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`DROP TYPE "public"."suppliers_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."transfers_type_enum" RENAME TO "transfers_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."transfers_type_enum" AS ENUM('internal', 'external')`);
        await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "type" TYPE "public"."transfers_type_enum" USING "type"::"text"::"public"."transfers_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transfers_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."transfers_status_enum" RENAME TO "transfers_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."transfers_status_enum" AS ENUM('requested', 'approved', 'in_transit', 'delivered', 'accepted', 'completed', 'cancelled', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "status" TYPE "public"."transfers_status_enum" USING "status"::"text"::"public"."transfers_status_enum"`);
        await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "status" SET DEFAULT 'requested'`);
        await queryRunner.query(`DROP TYPE "public"."transfers_status_enum_old"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3b2beba6a393519038d64b12ed" ON "branches" ("name", "companyId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9c1a78b27ce1426491f175e034" ON "suppliers" ("email", "companyId") WHERE email IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_85f92bfee8f136fab50cc3feb7" ON "suppliers" ("name", "companyId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8387ed27b3d4ca53ec3fc7b029" ON "branches" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e9739cd52e8a233dcc1510857a" ON "suppliers" ("email") WHERE email IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5b5720d9645cee7396595a16c9" ON "suppliers" ("name") `);
        await queryRunner.query(`ALTER TABLE "branches" ADD CONSTRAINT "FK_a35729a94e7280cbebaaa541a20" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD CONSTRAINT "FK_a16f3c2e9b291abc6790e9822ae" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transfers" ADD CONSTRAINT "FK_fffd70072ba5399bc01f4f8f2af" FOREIGN KEY ("deliveredById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transfers" ADD CONSTRAINT "FK_276096908e33ba8b4da0ff6054e" FOREIGN KEY ("acceptedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transfers" DROP CONSTRAINT "FK_276096908e33ba8b4da0ff6054e"`);
        await queryRunner.query(`ALTER TABLE "transfers" DROP CONSTRAINT "FK_fffd70072ba5399bc01f4f8f2af"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT "FK_a16f3c2e9b291abc6790e9822ae"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP CONSTRAINT "FK_a35729a94e7280cbebaaa541a20"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5b5720d9645cee7396595a16c9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9739cd52e8a233dcc1510857a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8387ed27b3d4ca53ec3fc7b029"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_85f92bfee8f136fab50cc3feb7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c1a78b27ce1426491f175e034"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b2beba6a393519038d64b12ed"`);
        await queryRunner.query(`CREATE TYPE "public"."transfers_status_enum_old" AS ENUM('cancelled', 'completed', 'in_transit', 'pending', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "status" TYPE "public"."transfers_status_enum_old" USING "status"::"text"::"public"."transfers_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."transfers_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."transfers_status_enum_old" RENAME TO "transfers_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."transfers_type_enum_old" AS ENUM('shop_to_shop', 'shop_to_warehouse', 'warehouse_to_shop', 'warehouse_to_warehouse')`);
        await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "type" TYPE "public"."transfers_type_enum_old" USING "type"::"text"::"public"."transfers_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."transfers_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."transfers_type_enum_old" RENAME TO "transfers_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."suppliers_status_enum_old" AS ENUM('active', 'blacklisted', 'inactive')`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" TYPE "public"."suppliers_status_enum_old" USING "status"::"text"::"public"."suppliers_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`DROP TYPE "public"."suppliers_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."suppliers_status_enum_old" RENAME TO "suppliers_status_enum"`);
        await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "acceptedById"`);
        await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "deliveredById"`);
        await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "acceptedDate"`);
        await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "deliveredDate"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "companyId"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "emergencyContact"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "companyId"`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "companyId" uuid`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "emergencyContact" json`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "companyId" uuid`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_85f92bfee8f136fab50cc3feb7" ON "suppliers" ("name", "companyId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9c1a78b27ce1426491f175e034" ON "suppliers" ("email", "companyId") WHERE (email IS NOT NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3b2beba6a393519038d64b12ed" ON "branches" ("name", "companyId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5b5720d9645cee7396595a16c9" ON "suppliers" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e9739cd52e8a233dcc1510857a" ON "suppliers" ("email") WHERE (email IS NOT NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8387ed27b3d4ca53ec3fc7b029" ON "branches" ("name") `);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD CONSTRAINT "FK_a16f3c2e9b291abc6790e9822ae" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "branches" ADD CONSTRAINT "FK_a35729a94e7280cbebaaa541a20" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
