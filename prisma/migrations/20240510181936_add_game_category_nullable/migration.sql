-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER,
    "url" TEXT NOT NULL,
    "showDetails" BOOLEAN NOT NULL DEFAULT false,
    "releaseDate" DATETIME,
    "companyName" TEXT,
    "description" TEXT,
    CONSTRAINT "Game_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Game" ("categoryId", "companyName", "description", "id", "name", "releaseDate", "showDetails", "url") SELECT "categoryId", "companyName", "description", "id", "name", "releaseDate", "showDetails", "url" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
