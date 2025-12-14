-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "locationArea" TEXT,
ADD COLUMN     "locationCity" TEXT,
ADD COLUMN     "locationLat" DOUBLE PRECISION,
ADD COLUMN     "locationLng" DOUBLE PRECISION;
