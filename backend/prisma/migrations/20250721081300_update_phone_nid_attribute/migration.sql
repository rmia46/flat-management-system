/*
  Warnings:

  - You are about to drop the column `phone` on the `Users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[Phone]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `Phone` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Made the column `NID` on table `Users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Users` DROP COLUMN `phone`,
    ADD COLUMN `Phone` VARCHAR(191) NOT NULL,
    MODIFY `NID` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Users_Phone_key` ON `Users`(`Phone`);
