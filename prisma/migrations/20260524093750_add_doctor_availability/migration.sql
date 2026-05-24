-- CreateTable
CREATE TABLE "DoctorAvailability" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "doctorId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "DoctorAvailability_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DoctorTimeOff" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "doctorId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "reason" TEXT,
    CONSTRAINT "DoctorTimeOff_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DoctorAvailability_doctorId_dayOfWeek_key" ON "DoctorAvailability"("doctorId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorTimeOff_doctorId_date_key" ON "DoctorTimeOff"("doctorId", "date");
