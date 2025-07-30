import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSettingsModule1753903866034 implements MigrationInterface {
    name = 'AddSettingsModule1753903866034'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."settings_measurementsystem_enum" AS ENUM('metric', 'imperial')`);
        await queryRunner.query(`CREATE TABLE "settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "safetyStockThreshold" integer NOT NULL DEFAULT '5', "expiryReminderDays" integer NOT NULL DEFAULT '30', "enableLowStockNotifications" boolean NOT NULL DEFAULT true, "enableExpiryNotifications" boolean NOT NULL DEFAULT true, "autoReorderEnabled" boolean NOT NULL DEFAULT false, "defaultTaxRate" numeric(5,2) NOT NULL DEFAULT '0', "defaultCurrency" character varying(10) NOT NULL DEFAULT 'USD', "measurementSystem" "public"."settings_measurementsystem_enum" NOT NULL DEFAULT 'metric', "enableAuditLogs" boolean NOT NULL DEFAULT true, "auditLogRetentionDays" integer NOT NULL DEFAULT '365', "enableTwoFactorAuth" boolean NOT NULL DEFAULT false, "sessionTimeoutMinutes" integer NOT NULL DEFAULT '30', "enableCaching" boolean NOT NULL DEFAULT true, "cacheExpirationSeconds" integer NOT NULL DEFAULT '300', "enableEmailNotifications" boolean NOT NULL DEFAULT false, "enableSmsNotifications" boolean NOT NULL DEFAULT false, "companyName" character varying(255), "companyAddress" character varying(255), "companyPhone" character varying(20), "companyEmail" character varying(255), "companyLogo" text, "notificationSettings" json, "reportSettings" json, "integrationSettings" json, "customSettings" json, CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "settings"`);
        await queryRunner.query(`DROP TYPE "public"."settings_measurementsystem_enum"`);
    }

}
