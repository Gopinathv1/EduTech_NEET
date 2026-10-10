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

Student-visible means exact approved content reachable in a published compatible English PYQ pool, verified from stored membership/rules and the current question-nature allowlist. All 780 are members of the five published fixed year practices. It does not certify every random difficulty/subject quota, checkout or every random quota. Authenticated fixed-year attempt and scoring E2E are verified separately below.

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

Review and release the NEET year-navigation change separately from new historical content; it exposes the existing 780 approved questions and clearly marks unavailable years. The final read-only approval check and isolated authenticated English start flow verification are recorded below. Then prepare a separately authorized 2019/2020 administrator-review/import batch. Continue 2014 from retained drafts and a complete same-code scan; retry failed 2013/2015–2018 gates only when new primary evidence is available. Stop before production release, push, merge or deployment.

COMMIT: Local readiness commit; hash returned on delivery.

## Final navigation release verification — 10 October 2026

Production approval/visibility reconciliation was refreshed at **2026-10-10T15:18:34.134Z** using the existing database-enforced read-only transaction. Results remain **780 approved and visible**: 2021 113, 2022 157, 2023 172, 2024 171, 2025 167. All approved source datasets, the sealed question payload and the 303 unpublished 2019/2020 records are unchanged. Only the snapshot timestamp changed. Historical source research was not restarted.

**Authenticated attempt E2E: PASS — seven Chromium tests.** The real local Next.js application ran against a newly initialized, disposable PostgreSQL database at `127.0.0.1:5547/neet_navigation_test`. A hard guard checks both connection URLs before fixture writes or browser startup. Only copies of the 780 already-approved payload records and five fixed year practices were loaded. Practice fixtures reconstruct the sealed fixed membership and year/source binding, with local free access and the existing default NEET scoring; they are not a full production database clone. This does not approve or import any staged record. Test students received signed, email-verified fixture sessions using the real session verifier; password/OTP login and external payment systems are outside this verification.

- Mobile 390 px and desktop 1,440 px: all thirteen year cards, exact five published year URLs/counts, partial-coverage wording and no horizontal overflow.
- 2013–2020: “Questions coming soon,” no count and no launch link. For 2019/2020, guessed direct start URLs contain no start button and authenticated start API requests return 404; no attempt is created.
- Each year 2021–2025: authenticated launch freezes the full approved year membership (113/157/172/171/167), English question access works, a correct answer is persisted, and resume retains that answer with exactly one attempt.
- Each year: real UI confirmation submits successfully and opens results. Database result is score 4, one correct, zero wrong and all remaining questions skipped. Repeating the submission API returns 200 while retaining exactly one result and one attempt.
- The first test run encountered a post-resume hydration race in the test driver. Waiting for the existing “Saved” readiness signal fixed the test; the complete rerun passed. No application, scoring, approval or attempt code was changed.

Reproducible browser suite: `playwright.neet-navigation.config.ts`, `e2e/neet-navigation.spec.ts`, `scripts/prepare-neet-navigation-e2e.ts`. Initialize an empty disposable local database with the repository schema, set **both** URLs to the guarded endpoint and a disposable `JWT_SECRET`, run `npx tsx scripts/prepare-neet-navigation-e2e.ts`, then `npx playwright test --config playwright.neet-navigation.config.ts`. The generic Playwright job excludes this separately guarded suite. Safe summarized evidence is [neet-navigation-e2e-evidence.json](neet-navigation-e2e-evidence.json); temporary databases, raw browser outputs and fixture sessions remain ignored.

Preservation: no runtime/application changes in this verification commit; JEE PYQs/mocks, NEET Full Mock, Admissions, Multilingual, scoring and existing attempts/results are untouched. Browser attempt writes occurred only in the disposable local database. Production access was SELECT-only. The 303 unpublished records remain absent from production and from the browser fixture.

Final checks: **7/7 browser E2E tests passed; 81/81 focused tests passed across 13 suites; typecheck, lint and build passed (144 static pages).** Existing workspace-root, deprecated Next lint and OpenTelemetry dependency warnings remain. The disposable database was stopped after verification.

**READY FOR DEPLOYMENT: YES for the existing approved-content NEET navigation, subject to the requested separate release decision.** No outstanding navigation/attempt verification blocker remains. Historical source blockers and unpublished 2019/2020 content remain excluded and do not authorize content release. No push, merge, deployment or production import was performed.