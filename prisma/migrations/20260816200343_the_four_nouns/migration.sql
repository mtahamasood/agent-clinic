-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ClinicNotice";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "modelFamily" TEXT NOT NULL,
    "intakeNotes" TEXT NOT NULL,
    "admittedOn" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Ailment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Symptom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ailmentId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "Symptom_ailmentId_fkey" FOREIGN KEY ("ailmentId") REFERENCES "Ailment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Therapy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "agentId" TEXT NOT NULL,
    "ailmentId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "diagnosedOn" DATETIME NOT NULL,
    "notes" TEXT,

    PRIMARY KEY ("agentId", "ailmentId"),
    CONSTRAINT "Diagnosis_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Diagnosis_ailmentId_fkey" FOREIGN KEY ("ailmentId") REFERENCES "Ailment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "therapyId" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Appointment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_therapyId_fkey" FOREIGN KEY ("therapyId") REFERENCES "Therapy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_AilmentToTherapy" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_AilmentToTherapy_A_fkey" FOREIGN KEY ("A") REFERENCES "Ailment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AilmentToTherapy_B_fkey" FOREIGN KEY ("B") REFERENCES "Therapy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Ailment_name_key" ON "Ailment"("name");

-- CreateIndex
CREATE INDEX "Symptom_ailmentId_idx" ON "Symptom"("ailmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Symptom_ailmentId_position_key" ON "Symptom"("ailmentId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Therapy_name_key" ON "Therapy"("name");

-- CreateIndex
CREATE INDEX "Diagnosis_ailmentId_idx" ON "Diagnosis"("ailmentId");

-- CreateIndex
CREATE INDEX "Appointment_scheduledFor_idx" ON "Appointment"("scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_therapyId_scheduledFor_key" ON "Appointment"("therapyId", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_agentId_scheduledFor_key" ON "Appointment"("agentId", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "_AilmentToTherapy_AB_unique" ON "_AilmentToTherapy"("A", "B");

-- CreateIndex
CREATE INDEX "_AilmentToTherapy_B_index" ON "_AilmentToTherapy"("B");

