CREATE TYPE "ContentClassification" AS ENUM ('SAMPLE', 'PRODUCTION');
CREATE TYPE "QuestionSourceType" AS ENUM ('INTERNALLY_AUTHORED', 'LICENSED', 'OFFICIAL_PREVIOUS_YEAR', 'OTHER');

ALTER TABLE "Question"
  ADD COLUMN "contentClass" "ContentClassification" NOT NULL DEFAULT 'SAMPLE',
  ADD COLUMN "sourceType" "QuestionSourceType",
  ADD COLUMN "sourceName" TEXT,
  ADD COLUMN "exam" TEXT,
  ADD COLUMN "examYear" INTEGER,
  ADD COLUMN "paperSession" TEXT,
  ADD COLUMN "licenseReference" TEXT,
  ADD COLUMN "reviewer" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

ALTER TABLE "Test"
  ADD COLUMN "contentClass" "ContentClassification" NOT NULL DEFAULT 'SAMPLE';

CREATE INDEX "Question_contentClass_status_isActive_idx" ON "Question"("contentClass", "status", "isActive");
CREATE INDEX "Test_contentClass_isPublished_idx" ON "Test"("contentClass", "isPublished");
