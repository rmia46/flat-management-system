-- CreateTable
CREATE TABLE `Users` (
    `UserID` INTEGER NOT NULL AUTO_INCREMENT,
    `FirstName` VARCHAR(191) NOT NULL,
    `LastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `PasswordHash` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `NID` VARCHAR(191) NULL,
    `Verified` BOOLEAN NOT NULL DEFAULT false,
    `UserType` VARCHAR(191) NOT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Users_email_key`(`email`),
    UNIQUE INDEX `Users_NID_key`(`NID`),
    PRIMARY KEY (`UserID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Flat` (
    `FlatID` INTEGER NOT NULL AUTO_INCREMENT,
    `OwnerID` INTEGER NOT NULL,
    `FlatNumber` VARCHAR(191) NULL,
    `floor` INTEGER NULL,
    `HouseName` VARCHAR(191) NULL,
    `HouseNumber` VARCHAR(191) NULL,
    `Address` VARCHAR(191) NOT NULL,
    `Latitude` DOUBLE NOT NULL,
    `Longitude` DOUBLE NOT NULL,
    `Rating` DECIMAL(3, 2) NULL,
    `bedrooms` INTEGER NULL,
    `bathrooms` INTEGER NULL,
    `balcony` BOOLEAN NOT NULL DEFAULT false,
    `MonthlyRentalCost` DECIMAL(10, 2) NOT NULL,
    `UtilityCost` DECIMAL(10, 2) NULL,
    `MinimumStay` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `Status` VARCHAR(191) NOT NULL DEFAULT 'available',
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`FlatID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Advertisement` (
    `AdID` INTEGER NOT NULL AUTO_INCREMENT,
    `FlatID` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `DatePosted` DATETIME(3) NOT NULL,
    `Validity` INTEGER NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`AdID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Booking` (
    `BookingID` INTEGER NOT NULL AUTO_INCREMENT,
    `UserID` INTEGER NOT NULL,
    `FlatID` INTEGER NOT NULL,
    `StartDate` DATETIME(3) NOT NULL,
    `EndDate` DATETIME(3) NOT NULL,
    `Status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `IsRecurring` BOOLEAN NOT NULL DEFAULT true,
    `DateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvedAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`BookingID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Extension` (
    `ExtensionID` INTEGER NOT NULL AUTO_INCREMENT,
    `BookingID` INTEGER NOT NULL,
    `StartDate` DATETIME(3) NOT NULL,
    `EndDate` DATETIME(3) NOT NULL,
    `ExtStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `DateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`ExtensionID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `PaymentID` INTEGER NOT NULL AUTO_INCREMENT,
    `BookingID` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `DatePaid` DATETIME(3) NOT NULL,
    `TransactionID` VARCHAR(191) NULL,
    `PaymentMethod` VARCHAR(191) NULL,
    `PaymentStatus` VARCHAR(191) NOT NULL DEFAULT 'completed',
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_TransactionID_key`(`TransactionID`),
    PRIMARY KEY (`PaymentID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `ReviewID` INTEGER NOT NULL AUTO_INCREMENT,
    `FlatID` INTEGER NOT NULL,
    `ReviewerID` INTEGER NOT NULL,
    `ReviewerRole` VARCHAR(191) NULL,
    `RatingGiven` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `Date` DATETIME(3) NOT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`ReviewID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Image` (
    `ImageID` INTEGER NOT NULL AUTO_INCREMENT,
    `FlatID` INTEGER NOT NULL,
    `URL` VARCHAR(191) NOT NULL,
    `IsThumbnail` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(191) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`ImageID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Amenity` (
    `AmenityID` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `Amenity_name_key`(`name`),
    PRIMARY KEY (`AmenityID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Flat_Amenities` (
    `FlatID` INTEGER NOT NULL,
    `AmenityID` INTEGER NOT NULL,

    PRIMARY KEY (`FlatID`, `AmenityID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Flat` ADD CONSTRAINT `Flat_OwnerID_fkey` FOREIGN KEY (`OwnerID`) REFERENCES `Users`(`UserID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Advertisement` ADD CONSTRAINT `Advertisement_FlatID_fkey` FOREIGN KEY (`FlatID`) REFERENCES `Flat`(`FlatID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_UserID_fkey` FOREIGN KEY (`UserID`) REFERENCES `Users`(`UserID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_FlatID_fkey` FOREIGN KEY (`FlatID`) REFERENCES `Flat`(`FlatID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Extension` ADD CONSTRAINT `Extension_BookingID_fkey` FOREIGN KEY (`BookingID`) REFERENCES `Booking`(`BookingID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_BookingID_fkey` FOREIGN KEY (`BookingID`) REFERENCES `Booking`(`BookingID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_FlatID_fkey` FOREIGN KEY (`FlatID`) REFERENCES `Flat`(`FlatID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_ReviewerID_fkey` FOREIGN KEY (`ReviewerID`) REFERENCES `Users`(`UserID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_FlatID_fkey` FOREIGN KEY (`FlatID`) REFERENCES `Flat`(`FlatID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Flat_Amenities` ADD CONSTRAINT `Flat_Amenities_FlatID_fkey` FOREIGN KEY (`FlatID`) REFERENCES `Flat`(`FlatID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Flat_Amenities` ADD CONSTRAINT `Flat_Amenities_AmenityID_fkey` FOREIGN KEY (`AmenityID`) REFERENCES `Amenity`(`AmenityID`) ON DELETE RESTRICT ON UPDATE CASCADE;
