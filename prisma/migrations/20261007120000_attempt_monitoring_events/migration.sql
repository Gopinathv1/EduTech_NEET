CREATE TYPE "AttemptMonitoringEventType" AS ENUM (
    'TAB_HIDDEN', 'WINDOW_BLUR', 'FULLSCREEN_EXIT',
    'COPY_ATTEMPT', 'PASTE_ATTEMPT', 'CONTEXT_MENU_ATTEMPT',
    'TAB_VISIBLE', 'WINDOW_FOCUS', 'FULLSCREEN_ENTER'
);

CREATE TABLE "AttemptMonitoringEvent" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "clientEventId" UUID NOT NULL,
    "eventType" "AttemptMonitoringEventType" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientTimestamp" TIMESTAMP(3),
    "sequence" INTEGER,

    CONSTRAINT "AttemptMonitoringEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AttemptMonitoringEvent_attemptId_clientEventId_key"
    ON "AttemptMonitoringEvent"("attemptId", "clientEventId");
CREATE INDEX "AttemptMonitoringEvent_attemptId_recordedAt_idx"
    ON "AttemptMonitoringEvent"("attemptId", "recordedAt");

ALTER TABLE "AttemptMonitoringEvent" ADD CONSTRAINT "AttemptMonitoringEvent_attemptId_fkey"
    FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
