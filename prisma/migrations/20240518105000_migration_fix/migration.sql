/*
  Warnings:

  - The primary key for the `telegraf-sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `telegraf-sessions` table. All the data in the column will be lost.
  - Added the required column `key` to the `telegraf-sessions` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_telegraf-sessions" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "session" TEXT
);
INSERT INTO "new_telegraf-sessions" ("session") SELECT "session" FROM "telegraf-sessions";
DROP TABLE "telegraf-sessions";
ALTER TABLE "new_telegraf-sessions" RENAME TO "telegraf-sessions";
PRAGMA foreign_key_check("telegraf-sessions");
PRAGMA foreign_keys=ON;
