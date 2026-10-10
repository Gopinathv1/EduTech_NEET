# English NEET PYQ 2013–2025 release readiness

Review date: **10 October 2026**. Branch: `codex/english-pyq-2013-2020`. Base: `4aace7038d2a8fedede974523bf2b78105d3d630`. Product scope: English NEET only; JEE development paused and existing functionality preserved.

**780 existing questions pass the source, exact-content, duplicate, approval and production-eligibility checks.** They are already approved and reachable through published English PYQ practices. The local package is a reconciliation of existing approved content, not authorization to import, approve or publish anything. **303 additional validated staged questions from 2019–2020 are absent from the production database and excluded.** No automatic approval occurred.

## Per-year reconciliation

| Year | Verified questions | DB approved | Student-visible | Blocked questions/slots | Release-ready |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2013 | 0 | 0 | 0 | 180 unprocessed source slots | 0 |
| 2014 | 0 | 0 | 0 | 180 not fully validated | 0 |
| 2015 | 0 | 0 | 0 | 180 re-test source slots | 0 |
| 2016 | 0 | 0 | 0 | 360 across separate phases | 0 |
| 2017 | 0 | 0 | 0 | 180 source slots | 0 |
| 2018 | 0 | 0 | 0 | 180 quarantined | 0 |
| 2019 | 156 | 0 | 0 | 156 awaiting import/review + 24 quarantined | 0 |
| 2020 | 147 | 0 | 0 | 147 awaiting import/review + 33 quarantined | 0 |
| 2021 | 113 | 113 | 113 | 87 quarantined | 113 |
| 2022 | 157 | 157 | 157 | 43 quarantined | 157 |
| 2023 | 172 | 172 | 172 | 28 quarantined | 172 |
| 2024 | 171 | 171 | 171 | 29 quarantined | 171 |
| 2025 | 167 | 167 | 167 | 13 quarantined | 167 |
| **Validated selection total** | **1,083** | **780** | **780** | **303 validated records excluded** | **780** |

Verified means complete source-validated question records in the repository, not merely an authenticated key. DB approval and student visibility refer to those exact identities. The database snapshot also checks unmatched historical NEET rows; none were found. Other NEET content, including Full Mock questions, is outside this PYQ selection. There are **437 existing quarantine records** (180 in 2018, 57 in 2019–2020, 200 in 2021–2025). Source-blocked/unprocessed slots are not quarantine records. Counts for early years describe one selected booklet order per legitimate paper/phase, not every shuffled variant or annual completeness. The cancelled 2015 exam is excluded. No year is represented as a complete annual bank.

## Live database evidence and local release package

`scripts/prepare-neet-release-readiness.ts --env-dir ..` reads the configured production target in a **database-enforced read-only transaction** (`SET TRANSACTION READ ONLY`). It contains no import, approval or publish mode. No user, attempt, answer or result records were read or modified. Credentials and reviewer names are not exported.

Checks compare exact external identity, exam/year, paper session, subject/chapter/topic, question type/image binding, English stem, all four options, correct answer and source/key references. Only whitespace is normalized for content equality; scientific symbols are not normalized away. Approval requires the existing approved/published/active production gate, a recorded reviewer/review timestamp and an English translation. Normalized English stems are compared within the selected repository content and against all existing NEET English stems in the database: **zero collisions** for this selection. This is not an exhaustive semantic duplicate review.

The sealed package is `data/previous-year/neet/release-2013-2025/`:

- `questions.json`: **780 exact source-verified and already-approved questions**, with database identity and approval evidence.
- `blocked.json`: **303 excluded staged identities**, with reasons; not an import payload.
- `manifest.json`: live UTC check timestamp, safe target fingerprint, source-file hashes, per-year counts, package hashes, five actual year-practice bindings and **32 review batches of at most 25 questions**.
- `evidence/`: desktop/mobile navigation and question screenshots plus rendering checks.

The package remains local with `productionReleaseAuthorized: false`, `importReady: false`, `published: false`. Snapshot approval evidence must be refreshed before any later release. The 780 records already exist in production; do not re-import them as new questions.

Student-visible means exact approved content reachable in a published compatible English PYQ pool, verified from stored membership/rules and the current question-nature allowlist. All 780 are members of the five published fixed year practices. It does not certify every random difficulty/subject quota, checkout, authenticated student attempt or scoring E2E.

## Historical source gates and outstanding issues

- **2014: official final key authenticated.** The archived CBSE welcome page explicitly links the final PDF, whose R page is headed final and dated 4 May 2014. The original English R scan is third-party hosted and cropped; complete wording/diagram verification remains unfinished. R Q28/Q170/Q175 award marks to everyone, not a guessed option. Key evidence, URL hashes and numbering are sealed in `data/previous-year/neet/2014/source-gate.json`; see [2014 report](aipmt-2014-completion.md).
- **2013: blocked.** Official CBSE result/OMR records were recovered, but no numbered official final key and exact original English booklet pair was authenticated. No bulk transcription or quarantine batch started; see [2013 report](neet-2013-completion.md).
- **2015–2018: existing findings preserved, not re-investigated.** 2015 re-test final-key authentication failed; 2016 phase-specific final status remains unresolved; 2017 final status remains unresolved; 2018 has 180 quarantined records and final-key/diagram blockers. Their existing completion reports remain unchanged.
- **2019–2020:** 303 source-validated staged questions need a separate authorized import and administrator review. No approval is inferred from staging. Remaining diagrams, unsupported answer cases, taxonomy or duplicate issues stay in existing quarantine.
- **2021–2025:** 780 approved questions are usable partial banks; 200 quarantined questions remain excluded. Existing source references and canonical question files are unchanged and embedded in the package.

## Student experience

NEET navigation lists **all thirteen years, 2013–2025**. The five approved years show actual fixed-practice membership counts. **2013–2020 show “Questions coming soon,” no invented question count and no empty practice launch link.** Counts are derived from approved database records and complete published memberships, not repository staging totals or the historical source inventory.

The year is resolved from the existing practice's `rules.year` (or an unambiguous singleton `rules.historical.years`), with conflicting bindings rejected. These existing year practices have a null `Test.year`; no database metadata was changed. If approval evidence cannot be read, NEET links/counts are withheld and the page explains that availability could not be verified. Existing JEE sections and links are preserved.

No scoring, Full Mock, attempts/results, approved question, generator, question-nature manifest, Multilingual or Admissions changes were made. New staged years were not added to generation allowlists.

## Validation

Focused NEET checks: **66 tests passed across 12 suites**, including source evidence, approval gates, year filters, duplicate identity, historical staging, question nature and Full Mock preservation. **Typecheck and lint passed** (no ESLint errors/warnings). **Build passed**, generating 144 static pages. Existing workspace-root and OpenTelemetry dependency warnings remain; no dependency changes were made. Desktop/mobile previews passed and screenshots were visually reviewed with the actual student theme wrapper. The local preview renders the **actual React year component** with the live read-only snapshot, and all 780 stems/3,120 options with the existing ExamClient whitespace/wrapping semantics at **360 px mobile and 1,280 px desktop**. Text/options and scientific symbols must remain unchanged, option selection must work and horizontal overflow must be absent. This is a local rendering preview, not authenticated production E2E.

## Next release recommendation

Review and release the NEET year-navigation change separately from new historical content; it exposes the existing 780 approved questions and clearly marks unavailable years. Re-check approval evidence and the authenticated English start flow before release. Then prepare a separately authorized 2019/2020 administrator-review/import batch. Continue 2014 from retained drafts and a complete same-code scan; retry failed 2013/2015–2018 gates only when new primary evidence is available. Stop before production release, push, merge or deployment.

COMMIT: Local readiness commit; hash returned on delivery.
