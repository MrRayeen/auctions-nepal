-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "delivery" TEXT DEFAULT 'Not Available';

-- CreateTable
CREATE TABLE "AuctionView" (
    "id" SERIAL NOT NULL,
    "auctionId" INTEGER NOT NULL,
    "userId" INTEGER,
    "ipAddress" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuctionView_auctionId_userId_key" ON "AuctionView"("auctionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionView_auctionId_ipAddress_key" ON "AuctionView"("auctionId", "ipAddress");

-- AddForeignKey
ALTER TABLE "AuctionView" ADD CONSTRAINT "AuctionView_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
