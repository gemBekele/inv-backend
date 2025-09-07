import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCustomerPhoneIndex1757254463654 implements MigrationInterface {
    name = 'UpdateCustomerPhoneIndex1757254463654'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the old global unique index on phoneNumber
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_3e418bff40d3abac5642cd5d39"`);
        
        // Create new composite unique index on phoneNumber and companyId
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_customer_phone_company" ON "customers" ("phoneNumber", "companyId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the composite index
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_phone_company"`);
        
        // Recreate the old global unique index
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3e418bff40d3abac5642cd5d39" ON "customers" ("phoneNumber")`);
    }
}