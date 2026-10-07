CREATE TYPE "QuestionTranslationSource" AS ENUM ('OFFICIAL_TRANSLATION', 'SIVORA_TRANSLATION');

ALTER TABLE "QuestionTranslation"
  ADD COLUMN "reviewState" "QuestionReviewState" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "translationSource" "QuestionTranslationSource",
  ADD COLUMN "sourceReference" TEXT,
  ADD COLUMN "reviewNote" TEXT,
  ADD COLUMN "reviewedById" TEXT,
  ADD COLUMN "reviewedByName" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "canonicalContentHash" TEXT,
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "QuestionTranslationVersion" (
  "id" TEXT NOT NULL,
  "translationId" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "editedById" TEXT NOT NULL,
  "editedByName" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionTranslationVersion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "QuestionTranslationVersion_translationId_revision_key" ON "QuestionTranslationVersion"("translationId", "revision");
ALTER TABLE "QuestionTranslationVersion" ADD CONSTRAINT "QuestionTranslationVersion_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "QuestionTranslation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
