# JEE Main 2021–2025 V1 production release

The exact authorized V1 is imported, approved, active and published on [SIVORA UP↑RISING](https://www.sivora-uprising.com/student/previous-year). Final read-only reconciliation and protected-baseline comparison passed, including a fresh comparison on October 7, 2026. All subsequent import, approval and practice dry-runs propose zero writes.

Authorized release SHA256: `1fdd7f03266ef2cdc8a0b9a9d1523821913996b47cc49d427cd43fe394dbc63e`.

| Authorized production operation | Actual |
|---|---:|
| Questions imported | 218 / 218 |
| Questions approved, published and active | 218 / 218 |
| QuestionVersion records | 654 |
| AuditLog records | 1,108 |
| Published free practice tests | 227 |
| Fixed TestQuestion membership records | 436 |
| Taxonomy writes | 0 |
| Migrations | 0 |
| Unrelated records modified | 0 |

Each question has the legitimate import, review-submission and approval history: 218 versions and audits per stage, totaling 654 of each. Each practice has one creation and one publication AuditLog, totaling 454 practice audits. Publication suppressed notifications and created no payment, student or attempt records. Import resumed after an expired transaction; the exact content and history guards confirmed previously committed batches before importing only the remaining rows.

The original sealed manifest remains unchanged, including its pre-authorization status. The explicit user authorization and this completion report record the production operation separately, preserving the approved hash and all 21 artifact hashes. Git now preserves the original CRLF bytes of the release manifest and final-key inventory; all 22 committed blobs match their sealed hashes across Windows and Linux checkouts.

## Coverage and provenance

| Inventory / review scope | Count |
|---|---:|
| Source shift inventory | 117 distinct year/session/date/shifts |
| Acquisition and final-key variants | 136 |
| Final-key question positions across variants | 11,670 |
| Selected source shifts | 5 |
| Questions in selected source papers | 435 |
| Questions individually reviewed | 285 |
| Validated and released | 218 |
| Quarantined | 67 |
| Unreviewed questions within selected papers, outside V1 | 150 |

Acquisition expansion stopped after useful representation across all five years. Final-key positions across variants are inventory counts, not a claim that all questions were reviewed or distinct. The five published historical shift sets are explicitly partial verified practice, separate from year aggregates.

| Year | Reviewed | Validated | Quarantined | Reviewed sessions | Reviewed shifts | Selected identity |
|---|---:|---:|---:|---:|---:|---|
| 2021 | 90 | 66 | 24 | 1 | 1 | Session 1 / February 24 / Shift 1 |
| 2022 | 45 | 33 | 12 | 1 | 1 | Session 2 / July 25 / Shift 1 |
| 2023 | 60 | 46 | 14 | 1 | 1 | Session 2 / April 6 / Shift 1 |
| 2024 | 45 | 37 | 8 | 1 | 1 | Session 2 / April 6 / Shift 1 |
| 2025 | 45 | 36 | 9 | 1 | 1 | Session 1 / January 22 / Shift 1 / Domestic |

All retained questions map to the exact NTA question ID in the applicable final answer key. Historical archive wording is labeled `HISTORICAL_VERIFIED`; source URLs, paper/key hashes and review evidence remain in the provenance manifests. For 2022, all 33 retained records preserve `originalQuestionNumber: null`, the exact NTA identity and separate source order. No original number was inferred.

The 2023, 2024 and 2025 extraction defects were corrected against original source representations before retention. MCQ options preserve actual displayed order. All 82 numerical answers are integers compatible with the existing JEE numerical-response engine.

| Classification | Count |
|---|---:|
| Physics | 61 |
| Chemistry | 68 |
| Mathematics | 89 |
| MCQ / SINGLE_CORRECT | 136 |
| NUMERICAL_VALUE | 82 |
| CONCEPTUAL_THEORY | 51 |
| NUMERICAL_PROBLEM_SOLVING | 167 |
| Canonical chapter classification | 218 / 218 |
| Populated canonical chapters | 50: Physics 17, Chemistry 19, Mathematics 14 |

Question Nature is recorded in the reviewable classification artifact and follows question semantics. Mathematics has zero conceptual/theory questions in this V1; empty-filter generation is rejected. Taxonomy gaps exclude 32 questions across 12 gap categories, documented in the quarantine and taxonomy-gap artifacts. No taxonomy was added or changed.

## Practice and validation

The 227 plans comprise five partial historical shifts, five year aggregates, one mixed plan, 18 year/mixed subject plans and 198 populated year/mixed chapter plans. Fixed shift/year plans account for all 436 memberships; random plans select only exact release questions. All practices are English, free, non-empty and published, with `payment: NONE` and `retake: FREE_UNLIMITED`.

| Product / verification | Result |
|---|---|
| Shift-wise | PARTIAL — five verified partial practices, complete identity preserved |
| Year-wise | PASS — all five years present |
| Mixed | PASS — deterministic 75-question selection, 20 MCQ + 5 numerical per subject, all five years represented |
| Subject | PASS — Physics, Chemistry and Mathematics |
| Chapter | PASS — populated canonical chapters only |
| Question Nature | PASS — exact eligible selection, both natures and empty-pool rejection |
| Database reconciliation | PASS — exact content, lifecycle history, audit counts, practice definitions and membership |
| Idempotence | PASS — zero remaining import, approval, publication, version, audit or membership writes |
| Repository tests | PASS — 448 passed, 3 skipped |
| Focused JEE tests | PASS — 45 passed |
| Typecheck / lint / whitespace | PASS |
| Production build | PASS — existing dependency/workspace warnings |
| CI for deployed application | PASS — quality and existing isolated E2E jobs |
| JEE desktop | PASS — isolated CI catalogue/navigation, nature counts and empty-filter protection |
| JEE mobile (390px) | PASS — isolated CI catalogue/navigation, nature counts, empty-filter protection and no horizontal overflow |
| JEE attempt lifecycle | PASS — MCQ/numerical input, persisted answers, resume, timer continuity, scoring, results, review and free retake |
| JEE conceptual selection / server deadline | PASS — frozen 51-question selection, all five years, automatic submission and filtered retake link |
| Complete isolated browser suite | PASS — 6 tests, including all 4 new JEE tests and existing registration/sample regressions |
| Production health / database | PASS — deep health HTTP 200 |
| Deployment | PASS — production alias promoted |

Production code commit: `4d91b3b2402f5f3f08afc3b7f02d70e4676e60e6`.

Application CI: [successful run 37485850418](https://github.com/Gopinathv1/EduTech_NEET/actions/runs/37485850418).

Final verification commit: `e6d49cd91f567009b2d2555c1dc234c5cc5ed448`. [Successful complete CI run 37560880644](https://github.com/Gopinathv1/EduTech_NEET/actions/runs/37560880644) passed lint, typecheck, 448 unit/integration tests (3 skipped), build and all 6 browser tests. The [Playwright report](https://github.com/Gopinathv1/EduTech_NEET/actions/runs/37560880644/artifacts/11456732445) includes attached desktop/mobile catalogue and empty-filter screenshots plus the numerical-input attempt screenshot; all five were visually inspected. CI fixtures refuse non-CI execution or either database URL outside `localhost:5432/neet_test` before any database access.

Deployment: [edu-tech-neet-1z8n-kycxd5vql-neet-assist.vercel.app](https://edu-tech-neet-1z8n-kycxd5vql-neet-assist.vercel.app), ID `dpl_C4GHMrRoRXPDPQ4z2LRMU5KivVjZ`. The build used `npm run build`, with no migration command. Temporary files, source PDFs, environment files and local credentials were excluded from the upload.

Production generator checks used read-only selection and created no attempts. Authenticated production desktop/mobile browser verification is unperformed: the connected browser has no signed-in student session, and the student catalogue redirects to login. The passed desktop/mobile and lifecycle browser checks used the isolated CI database with the exact released content; they are not authenticated live-production browser results.

## Protected baseline

Post-release fingerprint comparison: **UNCHANGED**. It covers all fields, translations and timestamps for protected question rows; test definitions and fixed memberships; and all protected NEET artifacts, including quarantine.

| Protected scope | Result |
|---|---|
| 780 NEET PYQs | PRESERVED |
| NEET nature: 629 conceptual / 151 numerical | PRESERVED |
| 278 NEET practice tests | PRESERVED |
| 200 NEET quarantined questions | PRESERVED |
| NEET Full Mock 1 | PRESERVED |
| JEE Main Full Mock 1 | PRESERVED |
| Both sample tests | PRESERVED |
| 67 quarantined JEE identities | EXCLUDED FROM IMPORT; artifacts preserved |
| Existing scoring / attempt architecture | PRESERVED |

Zero unrelated changes is supported by the restricted mutation paths and protected fingerprint comparison; no unrestricted full-database export was performed. No multilingual or monitoring work was started. `tmp/` is retained locally and untracked.

## Reviewable artifacts

- [Coverage checkpoint](jee-v1-coverage-checkpoint.md)
- [Exact pre-write gate](jee-v1-production-gate.md)
- [Sealed release manifest](../data/previous-year/jee/release-manifest.json)
- [Quarantine report](../data/previous-year/jee/quarantine-report.json)
- [Taxonomy gaps](../data/previous-year/jee/taxonomy-gap-report.json)
- [Classification report](../data/previous-year/jee/classification-report.json)
- [Read-only release verifier](../scripts/verify-jee-historical-release.ts)
- [Protected-baseline comparator](../scripts/verify-jee-protected-baseline.ts)

Final: **JEE MAIN 2021–2025 PYQ PRACTICE RELEASED — PRODUCTION DATA COMPLETE AND VERIFIED**. Authenticated production browser verification remains the stated separate limitation; desktop/mobile and lifecycle CI checks passed.
