-- Allow Google OAuth signups to exist briefly before mandatory mobile capture.
ALTER TABLE "Student" ADD COLUMN "googleSubject" TEXT;
ALTER TABLE "Student" ALTER COLUMN "mobile" DROP NOT NULL;

-- Normalize existing Indian student mobiles from 10 digits to E.164-style +91.
UPDATE "Student"
SET "mobile" = '+91' || "mobile"
WHERE "mobile" ~ '^[6-9][0-9]{9}$';

CREATE UNIQUE INDEX "Student_googleSubject_key" ON "Student"("googleSubject");

-- Store only hashed password-reset tokens. Email delivery can be wired later.
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_studentId_idx" ON "PasswordResetToken"("studentId");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

ALTER TABLE "PasswordResetToken"
ADD CONSTRAINT "PasswordResetToken_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
