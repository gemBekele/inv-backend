import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCompanyCustomer1757254463653 implements MigrationInterface {
    name = 'FixCompanyCustomer1757254463653'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "branches" DROP CONSTRAINT "FK_a35729a94e7280cbebaaa541a20"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT "FK_a16f3c2e9b291abc6790e9822ae"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8387ed27b3d4ca53ec3fc7b029"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9739cd52e8a233dcc1510857a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5b5720d9645cee7396595a16c9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b2beba6a393519038d64b12ed"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_85f92bfee8f136fab50cc3feb7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c1a78b27ce1426491f175e034"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "companyId"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "companyId"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "emergencyContact"`);
        // Add companyId as nullable first, then update existing records, then make it NOT NULL
        await queryRunner.query(`ALTER TABLE "branches" ADD "companyId" uuid`);
        
        // Get the first company ID to assign to existing branches
        const companies = await queryRunner.query(`SELECT id FROM "companies" LIMIT 1`);
        if (companies.length > 0) {
            const firstCompanyId = companies[0].id;
            await queryRunner.query(`UPDATE "branches" SET "companyId" = $1 WHERE "companyId" IS NULL`, [firstCompanyId]);
        }
        
        // Now make it NOT NULL
        await queryRunner.query(`ALTER TABLE "branches" ALTER COLUMN "companyId" SET NOT NULL`);
        
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "emergencyContact" json`);
        
        // Same for suppliers
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "companyId" uuid`);
        if (companies.length > 0) {
            const firstCompanyId = companies[0].id;
            await queryRunner.query(`UPDATE "suppliers" SET "companyId" = $1 WHERE "companyId" IS NULL`, [firstCompanyId]);
        }
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "companyId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "companyId" uuid`);
        await queryRunner.query(`ALTER TYPE "public"."suppliers_status_enum" RENAME TO "suppliers_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."suppliers_status_enum" AS ENUM('active', 'inactive', 'blacklisted')`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" TYPE "public"."suppliers_status_enum" USING "status"::"text"::"public"."suppliers_status_enum"`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`DROP TYPE "public"."suppliers_status_enum_old"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3b2beba6a393519038d64b12ed" ON "branches" ("name", "companyId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9c1a78b27ce1426491f175e034" ON "suppliers" ("email", "companyId") WHERE email IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_85f92bfee8f136fab50cc3feb7" ON "suppliers" ("name", "companyId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8387ed27b3d4ca53ec3fc7b029" ON "branches" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e9739cd52e8a233dcc1510857a" ON "suppliers" ("email") WHERE email IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5b5720d9645cee7396595a16c9" ON "suppliers" ("name") `);
        await queryRunner.query(`ALTER TABLE "branches" ADD CONSTRAINT "FK_a35729a94e7280cbebaaa541a20" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD CONSTRAINT "FK_a16f3c2e9b291abc6790e9822ae" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_568c2136b0779d63539cf84fafc" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_568c2136b0779d63539cf84fafc"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT "FK_a16f3c2e9b291abc6790e9822ae"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP CONSTRAINT "FK_a35729a94e7280cbebaaa541a20"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5b5720d9645cee7396595a16c9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9739cd52e8a233dcc1510857a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8387ed27b3d4ca53ec3fc7b029"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_85f92bfee8f136fab50cc3feb7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c1a78b27ce1426491f175e034"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b2beba6a393519038d64b12ed"`);
        await queryRunner.query(`CREATE TYPE "public"."suppliers_status_enum_old" AS ENUM('active', 'inactive', 'blacklisted', 'pending_approval', 'suspended')`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" TYPE "public"."suppliers_status_enum_old" USING "status"::"text"::"public"."suppliers_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`DROP TYPE "public"."suppliers_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."suppliers_status_enum_old" RENAME TO "suppliers_status_enum"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "companyId"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "companyId"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "emergencyContact"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "companyId"`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "emergencyContact" json`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "companyId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "companyId" uuid NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9c1a78b27ce1426491f175e034" ON "suppliers" ("email", "companyId") WHERE (email IS NOT NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_85f92bfee8f136fab50cc3feb7" ON "suppliers" ("name", "companyId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3b2beba6a393519038d64b12ed" ON "branches" ("name", "companyId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5b5720d9645cee7396595a16c9" ON "suppliers" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e9739cd52e8a233dcc1510857a" ON "suppliers" ("email") WHERE (email IS NOT NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8387ed27b3d4ca53ec3fc7b029" ON "branches" ("name") `);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD CONSTRAINT "FK_a16f3c2e9b291abc6790e9822ae" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "branches" ADD CONSTRAINT "FK_a35729a94e7280cbebaaa541a20" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
