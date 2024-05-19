-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "activeUsersOnly" BOOLEAN NOT NULL DEFAULT true,
    "wasHandled" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Notification" ("activeUsersOnly", "id", "message") SELECT "activeUsersOnly", "id", "message" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
PRAGMA foreign_key_check("Notification");
PRAGMA foreign_keys=ON;
