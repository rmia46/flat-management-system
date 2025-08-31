-- AlterTable
ALTER TABLE `Users` ADD COLUMN `VerificationCode` VARCHAR(191) NULL,
    ADD COLUMN `VerificationCodeExpires` DATETIME(3) NULL;
