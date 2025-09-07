import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBranchSupplierReportingFixed1756826085557 implements MigrationInterface {
    name = 'AddBranchSupplierReportingFixed1756826085557'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Drop existing indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_8387ed27b3d4ca53ec3fc7b029"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e9739cd52e8a233dcc1510857a"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_5b5720d9645cee7396595a16c9"`);

        // Step 2: Get a default company ID (create one if needed)
        const companyResult = await queryRunner.query(`SELECT id FROM "companies" LIMIT 1`);
        let defaultCompanyId: string;
        
        if (companyResult.length === 0) {
            // Create a default company if none exists
            const newCompanyResult = await queryRunner.query(`
                INSERT INTO "companies" ("id", "name", "address", "createdAt", "updatedAt") 
                VALUES (gen_random_uuid(), 'Default Company', 'Default Address', NOW(), NOW()) 
                RETURNING "id"
            `);
            defaultCompanyId = newCompanyResult[0].id;
        } else {
            defaultCompanyId = companyResult[0].id;
        }

        // Step 3: Add companyId columns as NULLABLE first
        await queryRunner.query(`ALTER TABLE "branches" ADD "companyId" uuid`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "companyId" uuid`);
        await queryRunner.query(`ALTER TABLE "products" ADD "companyId" uuid`);

        // Step 4: Update existing records with the default company ID
        await queryRunner.query(`UPDATE "branches" SET "companyId" = $1 WHERE "companyId" IS NULL`, [defaultCompanyId]);
        await queryRunner.query(`UPDATE "suppliers" SET "companyId" = $1 WHERE "companyId" IS NULL`, [defaultCompanyId]);
        // Note: products can remain NULL as per our entity definition

        // Step 5: Make companyId NOT NULL for branches and suppliers only
        await queryRunner.query(`ALTER TABLE "branches" ALTER COLUMN "companyId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "companyId" SET NOT NULL`);

        // Step 6: Add emergencyContact column to suppliers
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "emergencyContact" json`);

        // Step 7: Update supplier status enum
        await queryRunner.query(`ALTER TYPE "public"."suppliers_status_enum" RENAME TO "suppliers_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."suppliers_status_enum" AS ENUM('active', 'inactive', 'blacklisted', 'pending_approval', 'suspended')`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" TYPE "public"."suppliers_status_enum" USING "status"::text::"public"."suppliers_status_enum"`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`DROP TYPE "public"."suppliers_status_enum_old"`);

        // Step 8: Create new indexes
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3b2beba6a393519038d64b12ed" ON "branches" ("name", "companyId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_85f92bfee8f136fab50cc3feb7" ON "suppliers" ("name", "companyId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9c1a78b27ce1426491f175e034" ON "suppliers" ("email", "companyId") WHERE email IS NOT NULL`);
        
        // Recreate original unique indexes (but these will be less restrictive now due to company scoping)
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8387ed27b3d4ca53ec3fc7b029" ON "branches" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e9739cd52e8a233dcc1510857a" ON "suppliers" ("email") WHERE email IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5b5720d9645cee7396595a16c9" ON "suppliers" ("name") `);

        // Step 9: Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "branches" ADD CONSTRAINT "FK_a35729a94e7280cbebaaa541a20" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD CONSTRAINT "FK_a16f3c2e9b291abc6790e9822ae" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_47942e65af8e4235d4045515f05" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraints
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_47942e65af8e4235d4045515f05"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT "FK_a16f3c2e9b291abc6790e9822ae"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP CONSTRAINT "FK_a35729a94e7280cbebaaa541a20"`);
        
        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_5b5720d9645cee7396595a16c9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9739cd52e8a233dcc1510857a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8387ed27b3d4ca53ec3fc7b029"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c1a78b27ce1426491f175e034"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_85f92bfee8f136fab50cc3feb7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b2beba6a393519038d64b12ed"`);
        
        // Revert supplier status enum
        await queryRunner.query(`CREATE TYPE "public"."suppliers_status_enum_old" AS ENUM('active', 'inactive', 'blacklisted')`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" TYPE "public"."suppliers_status_enum_old" USING "status"::text::"public"."suppliers_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`DROP TYPE "public"."suppliers_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."suppliers_status_enum_old" RENAME TO "suppliers_status_enum"`);
        
        // Drop columns
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "companyId"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "companyId"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "emergencyContact"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "companyId"`);
        
        // Recreate original indexes
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5b5720d9645cee7396595a16c9" ON "suppliers" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e9739cd52e8a233dcc1510857a" ON "suppliers" ("email") WHERE (email IS NOT NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8387ed27b3d4ca53ec3fc7b029" ON "branches" ("name") `);
    }
}
