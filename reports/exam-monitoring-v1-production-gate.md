# SIVORA exam monitoring V1 — production gate

Prepared on 2026-10-07 from protected main `fc89f434d2e3dbcd6871b800ce723706ddb55289`.
Branch: `codex/exam-monitoring-v1`.
Implementation commit: `dc56c2d2ec69b88e524320a371e13c6f3770238b`.

## Behavior

The shared NEET/JEE active exam client captures browser signals, submits them to an authenticated owner-checked endpoint, stores only monitoring events, and exposes a read-only count/history on the owned student result page.

The nine allowlisted types are tab hidden/visible, window blur/focus, fullscreen exit/enter, copy attempt, paste attempt, and context-menu attempt. Browser APIs are initialized after hydration. Fullscreen remains optional; capture uses actual Fullscreen API transitions, with no resize/F11 inference. These browser signals do not establish misconduct or change scores. Browser support and delivered events vary; capture and upload are best effort. See [MDN visibilitychange](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event) and [MDN fullscreenchange](https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenchange_event).

Clipboard contents, IP addresses, browser/device fingerprints, recordings, webcam, microphone, biometrics, accusation labels, and monitoring scores are not collected. No monitoring endpoint cancels or finalizes an attempt.

The start page contains one subtle neutral notice. Results show “Monitoring events: <count>” and expandable latest-50 history using server receipt times displayed in IST. No appropriate existing admin attempt-detail page was found; the owned summary service and component remain reusable without an admin redesign.

## Isolation and limits

- Capture uses independent listeners, timers, storage, and uploads; it never joins the answer-save or submit chain.
- Monitoring failures are swallowed on the client. The exam continues saving, navigating, timing, and submitting normally.
- Monitoring storage failures return a neutral 503; result summary storage failures return no summary. The score/review render separately through Suspense.
- Only authenticated students owning an active, unexpired attempt can ingest. Server timer checks ignore the browser clock.
- Strict JSON allows only a 1–20 event batch, UUID client event identity, known type, optional ISO client timestamp, and bounded optional sequence. Actual streamed input is bounded to 16 KiB.
- Each event has a server-generated ID and authoritative database receipt timestamp. Retry identity is unique within an attempt; sequence is local to one document, not global history order.
- Client same-type debounce is 1 second. The server suppresses recent same-type noise while preserving distinct buffered occurrences with plausible client timestamps. Different native event types remain separate neutral signals.
- Serializable transactions bound persisted events across tabs/instances to 60 per minute and 1,000 per attempt, without updating or locking the parent attempt through a write. The client honors Retry-After.
- Pending uploads retain immutable identities in per-attempt sessionStorage across refresh, with at most 100 pending events and 20 per request. Storage failure is harmless. Retry delays and a 5-second upload timeout are separate from answers. Hidden/pagehide uses best-effort keepalive; completion/expiry stops capture without waiting on upload.
- Existing global navigation/exit behavior, optional fullscreen behavior, attempt engine, scoring, answer saves, submission, retakes, and practice selection are unchanged.

## Exact additive migration

`prisma/migrations/20261007120000_attempt_monitoring_events/migration.sql`

Creates enum `AttemptMonitoringEventType` and table/model `AttemptMonitoringEvent` with seven columns: `id`, `attemptId`, `clientEventId` (UUID), `eventType`, `recordedAt` (database default CURRENT_TIMESTAMP), nullable `clientTimestamp`, nullable `sequence`.

Adds primary key `AttemptMonitoringEvent_pkey`, unique index `(attemptId, clientEventId)`, lookup index `(attemptId, recordedAt)`, and a foreign key to `TestAttempt(id)` with the existing attempt deletion lifecycle via cascade. The Prisma inverse relation on TestAttempt adds no column. The offline baseline-to-proposed Prisma SQL diff confirms these are the only database structure changes.

No existing application rows or fields are modified by this migration or monitoring ingestion. Prisma migrate deploy will also record this applied migration in `_prisma_migrations` (migration bookkeeping). New event rows arise only from subsequent eligible active exam traffic.

Both runtime and direct URLs were safely inspected before read-only production verification. They identify the same production Neon project/database; the runtime URL is pooled and the direct URL is non-pooled. No credentials or full production rows were exported.

No production db push, migrate dev, reset, migration, event insertion, or deployment was executed. Applying the migration and deploying the reviewed code require the exact final authorization sentence.

Read-only production ledger/schema inspection confirmed this monitoring migration is the sole pending repository migration, no migration is failed, and neither the monitoring table nor enum exists yet.

## Verification evidence

Local repository suite: 525 tests passed, 3 skipped before the final extra streamed-cancellation test; all 78 finalized monitoring tests then passed. Final TypeScript and lint checks passed. Local production build passed with existing dependency/workspace warnings.

CI run: [37566399420](https://github.com/Gopinathv1/EduTech_NEET/actions/runs/37566399420).
Final CI quality passed: 526 tests passed, 3 skipped; TypeScript, lint, and build passed. Exact migration SQL check passed; all nine browser tests passed, including the three monitoring cases and the existing NEET, JEE, and both sample lifecycles. Two old result regressions now use an exact “Score” label selector so the new explanation does not create an ambiguous match; no sample content or scoring changed.

The CI migration probe guards CI=true and BOTH URLs exactly to localhost/127.0.0.1:5432/neet_test before any DB operation. It applies the exact SQL in a uniquely owned disposable schema with only a stub TestAttempt ID table. It checks all columns, enum, UUID, default receipt time, indexes, duplicate identity, FK, invalid type rejection, and cascades. It never changes the public CI dataset or production.

Three monitoring browser cases cover ownership, strict payload/privacy, server timestamp, immutable existing attempt fields, noise/caps, expiry, all nine DOM signals including the actual Fullscreen API, duplicate retry from multiple tabs, NEET score/submission/retake, JEE MCQ and numerical answers, upload failure, offline refresh, timer/resume/order preservation, mobile navigation/layout, result history, and payment-free practice. Existing NEET, exact JEE release, and sample lifecycle browser suites are retained.

Four monitoring screenshots from the implementation run were visually reviewed: desktop start notice, desktop expanded result history, 390px mobile JEE numerical attempt, and mobile result with collapsed monitoring history. The notice/history remain neutral and the mobile checks confirm no horizontal overflow. Screenshots are retained under untracked `tmp/monitoring-ci-feb9639/data/` and attached to the CI browser artifact.

## Protected baseline

Read-only production verification confirmed:

| Protected content | Verified count/status |
| --- | --- |
| NEET validated PYQ questions | 780; every stored field/translation fingerprint unchanged |
| NEET quarantine | 200; content unchanged |
| NEET practice tests | 278; every stored field/membership fingerprint unchanged |
| JEE validated V1 questions | 218; exact authorized release reconciled |
| JEE quarantine | 67; excluded and unchanged |
| JEE free practice tests | 227; definitions/pools reconciled |
| JEE memberships | 436 |
| JEE versions/audits | 654 / 1,108; no monitoring changes |
| Both Full Mock 1 tests and samples | Existing fields/questions/memberships unchanged |
| Answers, Question Nature, provenance | Protected data fingerprints and exact release reconciliation pass |
| Scoring and attempt engine source | No diff from protected main |

Production question and test fingerprints exactly match the saved pre-existing baseline. Windows working-tree NEET file bytes differ only in CRLF line endings; all 17 files match the saved baseline with LF normalization and have no Git diff. The saved baseline was not overwritten. Exact JEE release SHA256 remains `1fdd7f03266ef2cdc8a0b9a9d1523821913996b47cc49d427cd43fe394dbc63e`.

`tmp/` and `.vercel/` remain untracked and retained. No backup branch was touched. No protected dataset, taxonomy, practice membership, scoring, answer, or provenance source file changed in this branch.

## Production authorization gate

CODE STATUS: Implemented and pushed on codex/exam-monitoring-v1; tested deployment target dc56c2d2ec69b88e524320a371e13c6f3770238b.
TESTS: PASS — 526 unit/integration tests, 3 skipped; 9 browser tests; exact migration SQL check.
TYPECHECK: PASS.
LINT: PASS.
BUILD: PASS.

MIGRATION: 20261007120000_attempt_monitoring_events — additive; not applied to production.
TABLE/MODEL TO CREATE: AttemptMonitoringEvent; enum AttemptMonitoringEventType.
ROWS TO MODIFY IN EXISTING TABLES: 0 existing application rows; one new Prisma migration ledger entry.
QUESTION RECORDS MODIFIED: 0.
TEST/PRACTICE RECORDS MODIFIED: 0.
PROTECTED BASELINE STATUS: PASS — NEET 780/200/278; JEE 218/67/227; Full Mocks, samples, answers, scoring, Question Nature, and provenance unchanged.

Exact required authorization sentence:

“I authorize applying production migration 20261007120000_attempt_monitoring_events, including its migration ledger entry, and deploying commit dc56c2d2ec69b88e524320a371e13c6f3770238b for SIVORA NEET/JEE exam monitoring, with monitoring ingestion writing only to AttemptMonitoringEvent and all protected content unchanged.”
