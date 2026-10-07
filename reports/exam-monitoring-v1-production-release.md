# SIVORA exam monitoring V1 — production release

Released on 2026-10-07 following the user's exact migration and deployment authorization. The earlier [production gate](exam-monitoring-v1-production-gate.md) records the pre-authorization state.

## Deployment

| Item | Verified result |
| --- | --- |
| Live site | https://www.sivora-uprising.com |
| Approved runtime commit | `dc56c2d2ec69b88e524320a371e13c6f3770238b` |
| Deployment | `dpl_3UYajC2CXNGxERtmg1AGRBY7De2w` |
| Immutable deployment URL | https://edu-tech-neet-1z8n-mlebear97-neet-assist.vercel.app |
| Project / scope | `prj_TnahMvS93a8pa5xHnPJIT4TyYSZb` / `neet-assist` |
| Target / status | Production / READY; promoted successfully |
| Framework / build command | Next.js 15.5.22 / `npm run build` |
| Build to readiness | Approximately 131 seconds |

Deployment inputs came from a Git archive of the approved commit, independent of later documentation and local-artifact ignore commits. The 602 deployable source files were checked byte for byte against Git blobs before database access. Local environment files, credentials, working artifacts, and deployment metadata were excluded from the input manifest. Deployment metadata confirms `approvedCommitSha` equals the authorized SHA and `source` is `approved-git-archive`.

The production build completed before live promotion. Its logs confirm `npm run build`; the build did not run migrations or seeds. Existing dependency/Edge-runtime warnings remained non-blocking. The staged database health check returned 200 and the unauthenticated monitoring POST returned 401. The same build was promoted without rebuilding. Inspecting the live domain resolves to the approved deployment ID.

## Authorized additive migration

Applied exactly `20261007120000_attempt_monitoring_events` through Prisma migrate deploy, including one new successful migration ledger entry.

SQL SHA256: `be0e494032105dfcf218bed6cef2fc9b7a0d0c68fb364edc253f870a8a11dd43`.

Both runtime and direct database URLs were checked before database operations. They point to the same production Neon project/database; the runtime URL is pooled and the direct URL is non-pooled. Immediately before applying the migration, the guard confirmed this was the sole pending migration, no migration was failed, and the new table was absent. No other migration was applied.

Post-application and post-promotion read-only checks passed: one matching ledger record/checksum, zero pending or failed migrations, seven event columns, nine enum types, three indexes including the primary key, and the expected foreign key to TestAttempt. The event table held zero rows at the post-promotion check; no synthetic student, attempt, answer, or monitoring event was created during release verification.

The migration creates only the event enum, table, indexes, and child foreign key. It changes zero existing application rows. Monitoring ingestion can insert only into `AttemptMonitoringEvent`; ownership, active-attempt, server-deadline, strict-payload, duplicate, and rate checks remain in place. It does not write questions, tests, answers, scores, or parent attempt fields.

## Verification

- Exact-commit [CI run 37566399420](https://github.com/Gopinathv1/EduTech_NEET/actions/runs/37566399420): 526 unit/integration tests passed, three skipped; typecheck, lint, build, exact migration SQL probe, and all nine browser tests passed.
- Live `/api/health?deep=1`: HTTP 200, application status `ok`, database `ok`.
- Live unauthenticated POST to `/api/attempts/smoke-unowned/monitoring`: HTTP 401, `unauthorized`; no application writes.
- Bounded runtime log query for this deployment: zero error entries in the preceding ten-minute window, maximum twenty results.
- Authenticated NEET/JEE event capture, persistence, refresh/resume, failure isolation, scoring, submission, retake, and mobile flows passed against isolated CI data. Production verification used health and unauthenticated checks without creating exam fixtures or impersonating students.

## Protected content after promotion

| Protected content | Result |
| --- | --- |
| NEET validated questions / quarantine / practices | 780 / 200 / 278; unchanged |
| JEE validated questions / quarantine / practices | 218 / 67 / 227; reconciled to exact authorized release |
| JEE practice memberships | 436; unchanged |
| JEE QuestionVersion / AuditLog records | 654 / 1,108; unchanged |
| Both Full Mock 1 tests and both samples | Stored fields, questions, and memberships unchanged |
| Answers, Question Nature, translations, provenance | Protected fingerprints and release reconciliation passed |
| Scoring and existing attempt engine | Unchanged source; CI regressions passed |
| Taxonomy writes / unrelated content changes | 0 / 0 |

NEET production question and test fingerprints match the saved baseline. All seventeen local NEET JSON artifacts match its file hashes with LF normalization for Windows checkout line endings. The saved baseline was not overwritten and the protected source files were not edited. JEE release SHA256 remains `1fdd7f03266ef2cdc8a0b9a9d1523821913996b47cc49d427cd43fe394dbc63e`; all 67 quarantined questions remain excluded.

`tmp/` and `.vercel/` were retained and were not committed. No backup branch was touched. This release applied one authorized migration and promoted one deployment; it performed no dataset import, taxonomy write, practice change, or synthetic production exam write.
