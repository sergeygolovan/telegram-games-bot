/*
  Warnings:

  - The primary key for the `General` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `General` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_General" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "image" TEXT
);
INSERT INTO "new_General" ("code", "description", "image") SELECT "code", "description", "image" FROM "General";
DROP TABLE "General";
ALTER TABLE "new_General" RENAME TO "General";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
