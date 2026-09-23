-- Additive repair for environments where the applied content-readiness migration
-- is missing Question.externalId. Legacy rows intentionally remain NULL.
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "externalId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Question_externalId_key" ON "Question"("externalId");

-- Explicit V1 provenance values. Existing legacy enum values remain valid.
ALTER TYPE "QuestionSourceType" ADD VALUE IF NOT EXISTS 'SIVORA_AUTHORED';
ALTER TYPE "QuestionSourceType" ADD VALUE IF NOT EXISTS 'OFFICIAL_NTA';

DO $$ BEGIN
  CREATE TYPE "QuestionReviewState" AS ENUM ('DRAFT', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED', 'NEEDS_CORRECTION');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Question"
  ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "officialAnswerKeyReference" TEXT,
  ADD COLUMN IF NOT EXISTS "importedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reviewState" "QuestionReviewState" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS "reviewNote" TEXT;
