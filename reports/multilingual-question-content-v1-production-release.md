# SIVORA multilingual question content V1 — production release

Released on 2026-10-07 following the user's exact migration, proof-insert and deployment authorization. The earlier [production gate](multilingual-question-content-v1-production-gate.md) records the pre-authorization state.

## Live deployment

| Item | Verified result |
| --- | --- |
| Live site | https://www.sivora-uprising.com |
| Authorized runtime commit | `60e3b3b44f5dd7e37246ef2a0cd7d8f75d2478e4` |
| Deployment | `dpl_8tP2SwxtpXiy8ZyZkTfDKs58vUoo` |
| Immutable deployment URL | https://edu-tech-neet-1z8n-3tzrxx4l8-neet-assist.vercel.app |
| Project / scope | `prj_TnahMvS93a8pa5xHnPJIT4TyYSZb` / `neet-assist` |
| Target / status | Production / READY; promoted successfully |
| Framework / build command | Next.js / `npm run build` |
| Build to readiness | 127 seconds |

Deployment inputs came from a Git archive of the exact authorized commit, independent of later report commits or local files. Windows automatic line-ending conversion was disabled when producing the final archive. All 617 deployable files were checked byte for byte against Git blobs before any database write and again after deployment. Local environment files, credentials, ignored work artifacts and deployment metadata were excluded from the upload manifest. Metadata confirms `approvedCommitSha` equals the authorized commit and `source` is `approved-git-archive`.

The production deployment was staged with domain assignment disabled, checked, then promoted without rebuilding. The live custom domain resolves to that exact deployment ID. Build logs confirm `npm run build` and Prisma client generation; no extra migration, seed or database push ran during the deployment build. Existing dependency warnings remained non-blocking.

## Exact authorized migration and records

Applied only `20261007150000_question_translation_review`, including its one successful migration ledger entry. SQL SHA256: `5ba71dea3baaa04126124de931e52eee26494d9a8234b695d62bce116a4007fa`.

The additive migration created `QuestionTranslationSource` and `QuestionTranslationVersion`, and added the nine reviewed-translation metadata columns to the existing `QuestionTranslation` table. English wording, answers, existing content values and timestamps were preserved. Legacy review flags were not automatically promoted into translation approval. Prisma migration status reports the database schema is up to date with all 22 repository migrations applied; no migration is pending or failed.

Inserted only the exact proof release SHA256 `0ec36c13423b0b234a4d8bd0a91e7e0388ed8ff83bc7be7d93ab75a69a277898`:

| Authorized insert | Created |
| --- | ---: |
| QuestionTranslation | 20: Tamil 10 / Hindi 10 |
| QuestionTranslationVersion | 20 |
| AuditLog, entityType QuestionTranslation | 20 |
| Canonical Question / QuestionVersion | 0 / 0 |
| Tests, memberships, attempts, answers, results, monitoring | 0 |

The twenty translations cover the exact existing NEET 5 / JEE 5 proof questions and retain the sealed manifest content, provenance and canonical binding hashes. All twenty have SIVORA_TRANSLATION source, REVIEW_REQUIRED state, revision 1 and `reviewed=false`. Translation answer fields are null; reviewer identity/date/note are null. No translation was marked official or approved. The canonical English rows and answers remain authoritative.

Each translation has one initial version snapshot and one translation-only audit attributed to the existing active release administrator. Snapshots, content fields, canonical IDs/hashes, source references, review states and audit scope were verified after insertion and again after live promotion. All sixty records were inserted in one serializable transaction that checked unchanged pre-existing application-table fingerprints before commit. Existing target translation rows were required to be absent; none was overwritten.

**Student-visible proof translations: 0.** The production rows remain pending independent editorial review and explicit approval in the admin translation workflow. The deployed approved-only lookup returned null for every proof row. English fallback remains available while they await approval. This release did not authorize or perform their editorial approval.

## Verification

- Exact implementation [CI run 37574293046](https://github.com/Gopinathv1/EduTech_NEET/actions/runs/37574293046) passed: 571 unit/integration tests, 3 skipped; typecheck, lint, build, both exact migration SQL probes, and all 13 browser tests.
- Desktop NEET/JEE, mobile numerical and results, Tamil/Hindi switching, fallback/review workflow, timer/answer/position persistence, refresh, scoring, retake and monitoring regressions passed in disposable CI. Seven final screenshots were inspected before authorization.
- Staged deep health returned application JSON with HTTP 200 and database `ok`. Vercel Authentication was handled through the existing authenticated CLI; protection settings were not weakened.
- Staged translation-review and monitoring anonymous POSTs returned application-level HTTP 401 / `unauthorized`, using nonexistent resource IDs and no application sessions.
- After promotion, live `/api/health?deep=1` returned HTTP 200 / `ok`, database `ok`.
- Both live anonymous API checks returned HTTP 401 / `unauthorized`.
- Bounded runtime-error query for the exact deployment returned zero entries in the preceding ten-minute window, maximum twenty results.
- Production checks created no synthetic students, attempts, answers, results or monitoring events and did not impersonate a student or editor.

## Protected baseline after release

| Protected content | Verified |
| --- | --- |
| NEET validated / quarantine / practices | 780 / 200 / 278; unchanged |
| JEE validated / quarantine / free practices | 218 / 67 / 227; unchanged |
| JEE memberships | 436; unchanged |
| Original JEE QuestionVersion / AuditLog records | 654 / 1,108; unchanged |
| Both Full Mock 1 tests and both sample tests | Fields and memberships unchanged |
| Canonical text, answers, nature, approval, provenance, taxonomy | Unchanged |
| Existing application-table values | Pre-write checksums unchanged, excluding only authorized new records and migration bookkeeping |
| Existing attempts / answers / results / monitoring | 37 / 82 / 37 / 0; unchanged from the refreshed pre-write release snapshot |
| All canonical QuestionVersion records | 4,543; unchanged |
| Prior AuditLog records | 4,561; unchanged; exactly 20 new translation audits added |
| Prior QuestionTranslation records | 1,311 legacy field values unchanged; exactly 20 new proof rows added |

The execution snapshot was refreshed immediately before production writes. Normal application activity between the earlier gate and release had increased attempt/answer/result totals from the gate's 36 / 71 / 36 to 37 / 82 / 37. The release did not create or modify that history; it preserved the refreshed snapshot throughout migration, insertion, staging and promotion.

The saved NEET protected baseline was read without modification. All seventeen local protected NEET JSON hashes match after LF normalization, and stored question/test/membership fingerprints match the original baseline after excluding only the exact new proof translations. The protected JEE release remains SHA256 `1fdd7f03266ef2cdc8a0b9a9d1523821913996b47cc49d427cd43fe394dbc63e`. Exact lifecycle/history, 227 practice definitions, 436 memberships, five-year mixed quotas, representative generation, Question Nature filtering and empty-pool rejection passed read-only reconciliation.

`tmp/` and the existing `.vercel/` were retained without modification or deletion. No backup branch was changed. Source archives, guarded execution helpers, count/checksum snapshots and deployment checks stay in ignored `.next/`; they are not committed. The unrelated `.sanity-review/` directory remains untouched and excluded. This report is a documentation-only feature-branch change and does not change the deployed runtime commit.
