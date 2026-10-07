# SIVORA multilingual question content V1 — production gate

Prepared on 2026-10-07 from protected main `87b8b41788671afced0dba38a94385b69318b82e`.
Branch: `codex/multilingual-question-content-v1`.
Implementation/deployment target: `60e3b3b44f5dd7e37246ef2a0cd7d8f75d2478e4`.

## Behavior and review boundary

English already lives in `QuestionTranslation(language='en')`; it remains the canonical wording and sole source of answers. No English duplication or question-bank content was added to next-intl messages. Tamil and Hindi use the existing unique `(questionId, language)` translation records with separate provenance, review metadata, revisions and history.

Only explicitly APPROVED, reviewer-attributed translations bound to the current English wording/type/answers and passing mechanical QA are eligible for student payloads. DRAFT, REVIEW_REQUIRED, REJECTED, NEEDS_CORRECTION, missing and stale translations fall back to English with “Translation unavailable — showing English.” A legacy `reviewed=true` flag alone cannot bypass this gate. Missing translated explanations remain optional and show a separate English explanation indicator on results.

A dedicated question-language selector changes content without a route reload. Language and current question position are saved locally per attempt after hydration, so refresh/resume retains them in that browser. They are display preferences, with no attempt-field writes or cross-device persistence. Existing answer saves, timer deadline, question identity/order, scoring, submission and retakes retain their behavior. The existing per-attempt option permutation applies identically to English, Tamil and Hindi, including on results.

The admin translation page shows read-only English beside the Tamil/Hindi editor and immutable revision snapshots. Save draft, submit for review, approve, reject and request correction are explicit operations. Optimistic revision checks and a serializable transaction prevent stale overwrite. Every translation mutation adds its own `QuestionTranslationVersion` and `AuditLog(entityType='QuestionTranslation')`; it does not add a canonical `QuestionVersion` or reset canonical question approval. Editing approved wording immediately returns that translation to REVIEW_REQUIRED. Strict request schemas reject answer, type, nature and actor fields.

OFFICIAL_TRANSLATION requires a reference to the actual authoritative translated wording and explicit source attestation at approval. An official English paper/key alone does not qualify. The twenty proof translations are SIVORA_TRANSLATION, prepared in the repository without external translation services or coaching translations.

## Exact additive schema change

Migration: `20261007150000_question_translation_review`.
SQL: `prisma/migrations/20261007150000_question_translation_review/migration.sql`.
SQL SHA256: `5ba71dea3baaa04126124de931e52eee26494d9a8234b695d62bce116a4007fa`.

- New enum: `QuestionTranslationSource` with OFFICIAL_TRANSLATION / SIVORA_TRANSLATION.
- Existing table altered: `QuestionTranslation`, adding nine metadata columns: reviewState, translationSource, sourceReference, reviewNote, reviewedById, reviewedByName, reviewedAt, canonicalContentHash, revision. The existing QuestionReviewState enum is reused.
- New table: `QuestionTranslationVersion`, with snapshot, actor, action, revision and timestamp; unique translation/revision and a foreign key to its translation with the existing deletion lifecycle.
- No canonical question/answer, test, attempt or monitoring table alteration. No data-update statement or legacy auto-approval. Existing content values/timestamps remain unchanged; new metadata columns receive their stated defaults.
- Applying the migration requires one new `_prisma_migrations` ledger entry.

The offline baseline-to-proposed Prisma schema diff contains only these additive changes. Read-only production `prisma migrate status` confirmed this is the sole pending repository migration. It has not been applied to production.

## Controlled proof release and QA

Manifest: `data/question-translations-v1/proof-manifest.json`.
Authored wording: `data/question-translations-v1/proof-wording.json`.
Release SHA256 of `JSON.stringify(manifest.records)`: `0ec36c13423b0b234a4d8bd0a91e7e0388ed8ff83bc7be7d93ab75a69a277898`.

Exactly 10 canonical production questions: NEET 5 / JEE 5. Exactly 20 prepared translations: Tamil 10 / Hindi 10; official 0 / SIVORA 20. The canonical sample contains Physics 3, Chemistry 3, Biology 2 and Mathematics 2; MCQ 7 / NUMERICAL_VALUE 3; Conceptual/Theory 6 / Numerical/Problem-solving 4. Formula, chemistry-symbol, unit and numerical-answer cases are included. Existing classifications are retained.

All twenty records have REVIEW_REQUIRED state. They are not independently approved and would remain invisible to students after insertion until editorial approval through the new workflow. CI-only clone approvals exercise rendering and scoring without approving the production proof.

The offline validator resolves exact protected external IDs, binds English/type/answer hashes, validates option slots/count and compares protected scientific/rendering token multisets per statement/option. The implementation author checked the twenty statements and options against canonical English for meaning, completeness, option identity and absence of hints; independent editorial approval is pending. Mechanical token checks are conservative and do not establish semantic equivalence by themselves. Reviewers must explicitly attest meaning, completeness, formulas, units, option identity/order and absence of hints/answer leakage before approval. Explanations are omitted from this proof rather than invented.

Planned writes after a future explicit authorization: 20 new QuestionTranslation rows, 20 initial QuestionTranslationVersion rows and 20 translation-only AuditLog rows, plus the additive migration/ledger entry. No overwrite: the guarded read-only production preflight confirms all twenty target rows are absent and all ten canonical questions are published, active, approved production questions matching the manifest.

## Verification evidence

Final CI run: [37574293046](https://github.com/Gopinathv1/EduTech_NEET/actions/runs/37574293046), exact implementation commit above.
Final CI: PASS — 571 unit/integration tests passed, 3 skipped; typecheck, lint and production build passed; both exact migration SQL probes passed; all 13 browser tests passed (four new translation cases and nine retained NEET/JEE/sample/monitoring cases), with no failed or flaky tests.

Local final typecheck and lint passed; 52 focused translation/protected-release tests passed. The original implementation run passed all 570 unit/integration tests, typecheck, lint and build; the final run includes one additional canonical-release compatibility test.

Focused tests cover approved-only lookup, stale binding/answer changes, every fallback state, numeric/formula/unit tokens, strict admin payload/auth, provenance/attestations, review transitions, revision conflict, translation-only transaction writes, option permutation, no student answer/metadata leakage, English numerical scoring and malformed display preferences. The canonical JEE reconciler now tolerates separately versioned translated rows while still rejecting changed English, answers or historical identity.

The exact SQL probe is guarded by CI=true and BOTH URLs targeting localhost/127.0.0.1:5432/neet_test before any database operation. It applies the SQL in a uniquely owned disposable schema and verifies added columns/enum, unchanged English values/timestamps, no legacy auto-approval, unique history revisions, FK rejection and cascade. The existing exact monitoring migration probe and existing NEET/JEE/sample/monitoring browser suites are retained.

Four new browser cases exercise actual admin APIs and approved proof clones, NEET MCQ, JEE MCQ and JEE numerical answers; English → Tamil → Hindi; answer/option identity, running countdown/deadline, current position, refresh/resume, submission, score and retake; unavailable/unapproved/rejected fallbacks; read-only English admin UI; and approved translation edits without canonical changes. The 390px numerical case restores question position 2 of 2. They also exercise TAB_HIDDEN, WINDOW_BLUR, actual Fullscreen API FULLSCREEN_EXIT, COPY_ATTEMPT, PASTE_ATTEMPT and CONTEXT_MENU_ATTEMPT, with no horizontal overflow or client runtime errors.

Initial browser verification revealed two test defects: comparing the normal decreasing cached time to its pre-answer value, and a `/review/i` selector matching Overview. Assertions now check the unchanged start/deadline anchor and a non-resetting live countdown; the result tab uses its exact Answer review label. No timer or result-tab runtime change was needed.

Screenshot review: PASS. Seven final CI screenshots were inspected: NEET and JEE desktop attempts/results, 390px JEE numerical attempt/results, and admin translation review. Hindi wording/formulas, answer selection, live countdown, restored numerical position 2 of 2, English explanation fallback, correct numeric answer 15, monitoring summary and reviewer/provenance/history UI render correctly. Tamil rendering is asserted during each language-switch case and appears in the admin screenshot. Existing development OpenTelemetry dependency warnings remain non-blocking.

Screenshots and logs are retained in ignored `.next/translation-ci-60e3b3b/` and the final CI `playwright-report` artifact (ID `11462181426`); they are not committed or placed in `tmp/`.

## Protected production baseline

Only read-only production checks were run. The pooled runtime and non-pooled direct URLs identify the same existing Neon project/database; credentials and production row contents were not exported.

`scripts/verify-multilingual-protected-baseline.ts` matched the original saved question/test/file fingerprints without overwriting that baseline. All 17 protected NEET files match after Windows LF normalization. It preserves English and all non-proof legacy translations when later distinguishing the exact separately reviewed proof additions. The current preflight requires proof translations to be absent.

`scripts/translation-proof-dry-run.ts` has no write mode. It verifies the exact proof, protected JEE release/canonical data/history, original resolved random practice rules, all fixed memberships and pending migration. Server-side aggregate checks export only counts/checksums for existing history.

| Protected content | Verified |
| --- | --- |
| NEET validated / quarantine / practices | 780 / 200 / 278, unchanged |
| JEE validated / quarantine / free practices | 218 / 67 / 227, unchanged |
| JEE fixed memberships | 436, unchanged |
| JEE canonical versions / original release audits | 654 / 1,108, unchanged |
| Both Full Mock 1 tests / sample tests | 2 / 2, fields and memberships unchanged |
| Canonical answers, nature, approval, provenance | Exact protected baseline/release reconciliation passed |
| Existing attempts / answers / results / monitoring | 36 / 71 / 36 / 0, unchanged from earlier read-only check |

History aggregates matched exactly before and after final browser completion:

| Table | Count | Server-side checksum |
| --- | ---: | --- |
| TestAttempt | 36 | e5b02de72130349bf03a7bfcf0be5678 |
| Answer | 71 | 2207a2772b7cae2cdae4e3d6b04aee76 |
| Result | 36 | e7916d14730a1096ab0e60ef23dc2852 |
| AttemptMonitoringEvent | 0 | d41d8cd98f00b204e9800998ecf8427e |
| QuestionVersion | 4,543 | 4c6ca1aa1d031154efa2fdbf49a8f47c |
| AuditLog | 4,561 | 4271569cb8868238c8016d377eb088d7 |

Protected JEE release SHA256 remains `1fdd7f03266ef2cdc8a0b9a9d1523821913996b47cc49d427cd43fe394dbc63e`. No protected acquisition/quarantine artifacts, taxonomy, practices, membership, classification, scoring source or monitoring source were changed. Shared exam/review payload changes filter translation content while preserving canonical answers and the existing option permutation.

No production migration, translation insertion, history insertion, existing application-row write or deployment was executed. `tmp/` and `.vercel/` were not modified or deleted; only read access to the existing baseline/acquisition artifacts was used. New ignored CI artifacts live under `.next/`. No backup branch was touched. The unrelated untracked `.sanity-review/` directory is excluded from commits.

## Authorization gate

CODE STATUS: Implemented and pushed on codex/multilingual-question-content-v1; production unchanged; ready for authorization.
COMMIT: 60e3b3b44f5dd7e37246ef2a0cd7d8f75d2478e4 — tested implementation/deployment target; any later report-only commit does not change that target.
TESTS: PASS — 571 unit/integration tests, 3 skipped; both exact migration SQL probes passed.
TYPECHECK: PASS.
LINT: PASS.
BUILD: PASS.
BROWSER TESTS: PASS — 13; final desktop/mobile/admin screenshots reviewed.

MIGRATION: 20261007150000_question_translation_review — additive; not applied to production; one ledger entry after authorization.
NEW TABLES: 1 — QuestionTranslationVersion.
NEW ENUMS: 1 — QuestionTranslationSource.
EXISTING TABLES ALTERED: 1 — QuestionTranslation, nine additive metadata columns.

PROOF QUESTIONS: 10 existing canonical questions; no new canonical question rows.
NEET: 5.
JEE: 5.

TRANSLATION RECORDS: 20 prepared; production inserts 0 this run; planned initial translation versions/audits 20 / 20.
TAMIL: 10.
HINDI: 10.
OFFICIAL_TRANSLATION: 0.
SIVORA_TRANSLATION: 20 — all REVIEW_REQUIRED, pending independent editorial approval before student visibility.

CANONICAL QUESTION ROWS MODIFIED: 0.
CANONICAL ANSWERS MODIFIED: 0.
PRACTICE TESTS MODIFIED: 0.
ATTEMPTS MODIFIED: 0.
MONITORING RECORDS MODIFIED: 0.

FORMULA/NUMBER/UNIT QA: PASS — 20/20 mechanical checks; author meaning/completeness checks recorded; independent editorial approval pending.
OPTION IDENTITY QA: PASS — fixed canonical A/B/C/D slots, preserved per-attempt shuffle, no translated answer fields.
SCORING REGRESSION: PASS — NEET MCQ, JEE MCQ and JEE numerical submission/results/retake; retained protected suites.
MONITORING REGRESSION: PASS — all six required signals plus the retained monitoring suite; semantics unchanged.

PROTECTED BASELINE STATUS: PASS — NEET 780 / 200 / 278; JEE 218 / 67 / 227; JEE 436 memberships and 654 versions / 1,108 original audits; both Full Mocks, samples, nature, canonical answers, provenance, attempt/answer/result/monitoring and canonical history fingerprints unchanged. Production writes/migrations/inserts/deployment: 0.

Exact authorization sentence:

“I authorize applying production migration 20261007150000_question_translation_review and its migration ledger entry, inserting only the exact 20 REVIEW_REQUIRED SIVORA_TRANSLATION proof records in release SHA256 0ec36c13423b0b234a4d8bd0a91e7e0388ed8ff83bc7be7d93ab75a69a277898 with their 20 QuestionTranslationVersion and 20 translation-only AuditLog records, and deploying commit 60e3b3b44f5dd7e37246ef2a0cd7d8f75d2478e4, with zero canonical question, answer, practice, attempt, monitoring-record or unrelated changes.”

This sentence does not approve the proof translations for student visibility. Stop here and wait for explicit authorization before production changes.
