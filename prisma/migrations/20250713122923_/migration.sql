/*
  Warnings:

  - Added the required column `email` to the `VinReport` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VinReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vin" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL
);
INSERT INTO "new_VinReport" ("data", "id", "timestamp", "type", "vin") SELECT "data", "id", "timestamp", "type", "vin" FROM "VinReport";
DROP TABLE "VinReport";
ALTER TABLE "new_VinReport" RENAME TO "VinReport";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
