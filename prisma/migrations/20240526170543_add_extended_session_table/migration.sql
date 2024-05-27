-- CreateTable
CREATE TABLE "Session" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "userName" TEXT,
    "fullName" TEXT,
    "session" TEXT
);
