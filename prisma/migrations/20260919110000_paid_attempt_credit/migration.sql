CREATE TABLE "PaidAttemptCredit" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "testId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "attemptId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "consumedAt" TIMESTAMP(3),
  CONSTRAINT "PaidAttemptCredit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PaidAttemptCredit_paymentId_key" ON "PaidAttemptCredit"("paymentId");
CREATE UNIQUE INDEX "PaidAttemptCredit_attemptId_key" ON "PaidAttemptCredit"("attemptId");
CREATE INDEX "PaidAttemptCredit_studentId_testId_consumedAt_idx" ON "PaidAttemptCredit"("studentId", "testId", "consumedAt");
ALTER TABLE "PaidAttemptCredit" ADD CONSTRAINT "PaidAttemptCredit_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaidAttemptCredit" ADD CONSTRAINT "PaidAttemptCredit_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaidAttemptCredit" ADD CONSTRAINT "PaidAttemptCredit_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaidAttemptCredit" ADD CONSTRAINT "PaidAttemptCredit_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
