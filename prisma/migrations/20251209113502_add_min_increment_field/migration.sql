-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Auction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startingPrice" REAL NOT NULL,
    "currentPrice" REAL NOT NULL,
    "minIncrement" REAL NOT NULL DEFAULT 100,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "imageUrl" TEXT,
    "tags" TEXT,
    "sellerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Auction_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Auction" ("createdAt", "currentPrice", "description", "endTime", "id", "imageUrl", "sellerId", "startTime", "startingPrice", "tags", "title", "updatedAt") SELECT "createdAt", "currentPrice", "description", "endTime", "id", "imageUrl", "sellerId", "startTime", "startingPrice", "tags", "title", "updatedAt" FROM "Auction";
DROP TABLE "Auction";
ALTER TABLE "new_Auction" RENAME TO "Auction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
