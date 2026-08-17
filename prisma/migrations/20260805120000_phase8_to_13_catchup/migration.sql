-- CreateEnum
CREATE TYPE "LeadEventType" AS ENUM ('CREATED', 'STATUS_CHANGE', 'ASSIGNMENT', 'NOTE');

-- AlterTable
ALTER TABLE "AdmissionLead" ADD COLUMN     "consentAt" TIMESTAMP(3),
ADD COLUMN     "interestedCountryIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "visited" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "createdByName" TEXT,
ADD COLUMN     "deliveredCount" INTEGER,
ADD COLUMN     "linkUrl" TEXT,
ADD COLUMN     "targetBoard" TEXT,
ADD COLUMN     "targetClass" TEXT,
ADD COLUMN     "targetDistrict" TEXT;

-- AlterTable
ALTER TABLE "TestAttempt" ADD COLUMN     "questionOrder" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "seed" TEXT;

-- CreateTable
CREATE TABLE "LeadEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "adminId" TEXT,
    "adminName" TEXT,
    "type" "LeadEventType" NOT NULL,
    "note" TEXT,
    "fromStatus" "LeadStatus",
    "toStatus" "LeadStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowEnd" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "LeadEvent_leadId_idx" ON "LeadEvent"("leadId");

-- CreateIndex
CREATE INDEX "RateLimit_windowEnd_idx" ON "RateLimit"("windowEnd");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "Notification_targetAudience_isPublished_createdAt_idx" ON "Notification"("targetAudience", "isPublished", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Student_createdAt_idx" ON "Student"("createdAt");

-- CreateIndex
CREATE INDEX "Student_board_idx" ON "Student"("board");

-- CreateIndex
CREATE INDEX "Student_class_idx" ON "Student"("class");

-- CreateIndex
CREATE INDEX "TestAttempt_createdAt_idx" ON "TestAttempt"("createdAt");

-- AddForeignKey
ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "AdmissionLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

