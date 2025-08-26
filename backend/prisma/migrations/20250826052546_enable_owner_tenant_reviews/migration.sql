/*
  Warnings:

  - A unique constraint covering the columns `[BookingID,ReviewerID]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Review` DROP FOREIGN KEY `Review_BookingID_fkey`;

-- DropIndex
DROP INDEX `Review_BookingID_key` ON `Review`;

-- CreateIndex
CREATE UNIQUE INDEX `Review_BookingID_ReviewerID_key` ON `Review`(`BookingID`, `ReviewerID`);

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_BookingID_fkey` FOREIGN KEY (`BookingID`) REFERENCES `Booking`(`BookingID`) ON DELETE SET NULL ON UPDATE CASCADE;
