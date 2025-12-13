-- AlterTable
ALTER TABLE "User" ADD COLUMN "citizenshipBack" TEXT;
ALTER TABLE "User" ADD COLUMN "citizenshipFront" TEXT;
ALTER TABLE "User" ADD COLUMN "currentAddress" TEXT;
ALTER TABLE "User" ADD COLUMN "kycRejectionReason" TEXT;
ALTER TABLE "User" ADD COLUMN "kycStatus" TEXT DEFAULT 'NOT_SUBMITTED';
ALTER TABLE "User" ADD COLUMN "kycSubmittedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "kycVerifiedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "permanentAddress" TEXT;
ALTER TABLE "User" ADD COLUMN "selfieWithCitizenship" TEXT;
