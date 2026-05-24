/*
  Warnings:

  - Added the required column `appointmentEndDate` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patientId" INTEGER NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "appointmentDate" DATETIME NOT NULL,
    "appointmentEndDate" DATETIME NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("appointmentDate", "appointmentEndDate", "createdAt", "doctorId", "durationMinutes", "id", "patientId", "reason", "status", "type", "updatedAt") SELECT "appointmentDate", "appointmentDate", "createdAt", "doctorId", "durationMinutes", "id", "patientId", "reason", "status", "type", "updatedAt" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
