/*
  Warnings:

  - You are about to drop the column `ReviewerRole` on the `Review` table. All the data in the column will be lost.
  - You are about to alter the column `RatingGiven` on the `Review` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(3,2)`.
  - A unique constraint covering the columns `[BookingID]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Review` DROP FOREIGN KEY `Review_FlatID_fkey`;

-- DropForeignKey
ALTER TABLE `Review` DROP FOREIGN KEY `Review_ReviewerID_fkey`;

-- DropIndex
DROP INDEX `Review_FlatID_fkey` ON `Review`;

-- DropIndex
DROP INDEX `Review_ReviewerID_fkey` ON `Review`;

-- AlterTable
ALTER TABLE `Review` DROP COLUMN `ReviewerRole`,
    ADD COLUMN `BookingID` INTEGER NULL,
    ADD COLUMN `ReviewedUserID` INTEGER NULL,
    ADD COLUMN `cooperation` INTEGER NULL,
    ADD COLUMN `flatQuality` INTEGER NULL,
    ADD COLUMN `hygiene` INTEGER NULL,
    ADD COLUMN `location` INTEGER NULL,
    ADD COLUMN `ownerBehavior` INTEGER NULL,
    ADD COLUMN `tenantBehavior` INTEGER NULL,
    MODIFY `RatingGiven` DECIMAL(3, 2) NOT NULL,
    MODIFY `comment` TEXT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Review_BookingID_key` ON `Review`(`BookingID`);

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_FlatID_fkey` FOREIGN KEY (`FlatID`) REFERENCES `Flat`(`FlatID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_ReviewerID_fkey` FOREIGN KEY (`ReviewerID`) REFERENCES `Users`(`UserID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_ReviewedUserID_fkey` FOREIGN KEY (`ReviewedUserID`) REFERENCES `Users`(`UserID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_BookingID_fkey` FOREIGN KEY (`BookingID`) REFERENCES `Booking`(`BookingID`) ON DELETE SET NULL ON UPDATE CASCADE;
