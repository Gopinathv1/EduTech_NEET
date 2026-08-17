CREATE TYPE "AgencyApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MORE_INFO_REQUIRED', 'SUSPENDED');

CREATE TYPE "AgencyUserRole" AS ENUM ('OWNER', 'STAFF');

CREATE TABLE "Agency" (
  "id" TEXT NOT NULL,
  "partnerCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contactPerson" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "mobile" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'India',
  "website" TEXT,
  "registrationNumber" TEXT,
  "approvalStatus" "AgencyApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "reviewNote" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyUser" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "mobile" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "AgencyUserRole" NOT NULL DEFAULT 'OWNER',
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AgencyUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Agency_partnerCode_key" ON "Agency"("partnerCode");
CREATE UNIQUE INDEX "Agency_email_key" ON "Agency"("email");
CREATE INDEX "Agency_approvalStatus_idx" ON "Agency"("approvalStatus");
CREATE INDEX "Agency_isActive_idx" ON "Agency"("isActive");
CREATE INDEX "Agency_createdAt_idx" ON "Agency"("createdAt");

CREATE UNIQUE INDEX "AgencyUser_email_key" ON "AgencyUser"("email");
CREATE INDEX "AgencyUser_agencyId_idx" ON "AgencyUser"("agencyId");
CREATE INDEX "AgencyUser_role_idx" ON "AgencyUser"("role");
CREATE INDEX "AgencyUser_isActive_idx" ON "AgencyUser"("isActive");

ALTER TABLE "AgencyUser" ADD CONSTRAINT "AgencyUser_agencyId_fkey"
  FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
