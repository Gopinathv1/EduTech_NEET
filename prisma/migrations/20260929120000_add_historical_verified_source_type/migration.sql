-- Distinguishes wording recovered from a reputable historical archive and
-- validated against authoritative exam evidence from content directly
-- published by NTA. PostgreSQL enum additions are additive and preserve every
-- existing question row.
ALTER TYPE "QuestionSourceType" ADD VALUE IF NOT EXISTS 'HISTORICAL_VERIFIED';
