/*
  Warnings:

  - You are about to drop the column `VerificationCode` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `VerificationCodeExpires` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Users` DROP COLUMN `VerificationCode`,
    DROP COLUMN `VerificationCodeExpires`;
