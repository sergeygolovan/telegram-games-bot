-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_General" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "image" TEXT
);
INSERT INTO "new_General" ("description", "id", "image") SELECT "description", "id", "image" FROM "General";
DROP TABLE "General";
ALTER TABLE "new_General" RENAME TO "General";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
