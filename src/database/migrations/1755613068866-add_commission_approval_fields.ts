import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommissionApprovalFields1755613068866 implements MigrationInterface {
    name = 'AddCommissionApprovalFields1755613068866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "commissions" ADD "isApproved" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "commissions" ADD "approvedBy" uuid`);
        await queryRunner.query(`ALTER TABLE "commissions" ADD "approvedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "commissions" DROP COLUMN "approvedAt"`);
        await queryRunner.query(`ALTER TABLE "commissions" DROP COLUMN "approvedBy"`);
        await queryRunner.query(`ALTER TABLE "commissions" DROP COLUMN "isApproved"`);
    }

}
