# NEET (UG) 2018 AA / ACHLA English staging — blocked

## Targeted remediation — 9 October 2026

OFFICIAL KEY AUTHENTICATED: **No — BLOCKED.** CBSE is the issuing authority. Its [2018–19 annual report](https://www.cbse.gov.in/cbsenew/annual-report/Annual_Report_2018_19.pdf), printed page 50 (PDF page 54), confirms that answer keys and booklet codes were hosted in candidate login accounts and challenges were addressed before results. It does not reproduce AA answers or establish that the mirrored 30 May artifact is the final key. The [official press archive](https://www.cbse.gov.in/cbsenew/press_archive.html) contains exam-conduct notices but no matching final-key link was located in the May–July 2018 entries. The historical CBSE NEET endpoint remains unavailable through the research tool. This is a failure to authenticate available evidence, not a claim that no official final key exists.

VALIDATED: **0**. No promotions or answer changes. All 180 existing slots reused; no new extraction or transcription performed. The 167 frozen transcriptions, 13 original diagram crops, source-slot ledger and candidate tokens are unchanged from `858980ba94717eb3daa241cee2011717694cde65`.

QUARANTINED: **180**, inactive and unpublished. Unaccounted slots: **0**.

GLYPH ISSUES RESOLVED: **4 — Q12, Q18, Q34, Q36**. Only the unsupported combining vector-arrow forms in their recovered staging text are converted to explicit `vec(V)`, `vec(E)` and `vec(F)` notation. Vector/scalar distinctions, signs, coefficients, unit vectors and options are preserved. Frozen original transcriptions and per-record original text remain available. This portable linear notation works in the existing plain-text rendering semantics; it does not require an application renderer change. Both mobile and desktop screenshots were visually inspected: no missing vector glyphs, clipping or horizontal overflow.

TEST RESULTS: **31 tests across six focused suites passed; typecheck, lint and build passed.** Local 360 px / 1100 px previews check all 167 complete texts, 668 options, 13 source images and radio selection; screenshots include all four corrected questions. Browser scope remains a local unpublished staging review, not authenticated production practice. No source/answer validation is inferred from rendering success.

COMMIT: Local remediation commit based on `858980ba94717eb3daa241cee2011717694cde65`; resulting hash returned on delivery.

REMAINING BLOCKERS: Authenticated CBSE final AA / ACHLA key and its 180 answer bindings; candidate/coaching conflicts Q27/Q50; 13 incomplete diagram/structural records; classification gaps Q95/Q97; full-question collision review Q109/Q130. A post-challenge date or coaching agreement cannot clear the key gate. All records remain **BLOCKED_UNPUBLISHED**.

Authentication findings and alignment limitations are recorded in `data/previous-year/neet/2018/answer-key-authentication.json` and hash-pinned by the source manifest. Candidate numbering aligns structurally to AA / ACHLA page 1 only; final answer alignment remains unverified. NEET 2019 and 2020 are unchanged. No production writes, push, merge or deployment occurred.

## Original staging record, updated for current notation status

SOURCE VERIFIED: English booklet wording, printed AA / ACHLA identity and 180-question pattern reviewed. **The matching official final answer key has not been authenticated.** The 30 May 2018 archived key is retained as candidate evidence only. Neither mirror hosting nor a post-challenge printed date establishes an official final publication chain.

QUESTIONS EXTRACTED: 180 numbered source slots, 1–180, on PDF/booklet pages 2–21. There are 167 complete English text/option transcriptions and 13 diagram-dependent items preserved as original source crops.

QUESTIONS VALIDATED: **0** end-to-end source-and-answer-verified questions. Complete transcription is a separate measure and is not counted as validated coverage. `questions.json` is empty.

QUESTIONS QUARANTINED: **180**, all inactive DRAFT / QUARANTINED. Candidate printed key tokens remain explicitly unverified; no `correctOption` or `officialAcceptedOptions` is assigned. Eight review batches contain at most 25 numbered slots each.

QUESTIONS UNACCOUNTED: **0** printed slots. Missing usable validated coverage: **180**. Approved: 0. Student-visible: 0. This is **BLOCKED_UNPUBLISHED**, not a completed student-ready paper.

TEST RESULTS: 31 focused tests across six suites passed; typecheck, lint and build passed. Local mobile/desktop DOM, option-selection, wrapping and image-loading checks passed. Four previously unsupported vector-arrow cases now use verified explicit linear vector notation; source/answer readiness remains blocked.

COMMIT: Local commit containing this report on `codex/english-pyq-2013-2020`, based on the preserved 2019 checkpoint `57dc25b8f6215e599bfa4cdceae47bd84fe6e344`. The resulting commit ID is returned with delivery.

## Paper identity and source review

The selected paper is the **6 May 2018 NEET (UG), English-only booklet AA, booklet family ACHLA**. The cover states 24 pages and 180 questions. Question-bearing pages are 2–21; pages 22–23 are rough-work space. Physics occupies Q1–45, Chemistry Q46–90 and Biology Q91–180. Other booklet codes and languages are excluded.

All question-bearing pages were rendered and visually reviewed. English wording, original spelling, scientific values and printed option order were retained. Extracted PDF text was an aid, not an automatic validation decision. Superscripts/subscripts, Greek letters, charge signs and vector notation were manually reconstructed where the PDF text layer separated them. Fractions and matching tables use explicit grouping and labelled rows. Q37 received a close-up check to preserve its printed option order: 0·053, 0·525, 0·521, 0·529 cm. Incorrect distractors, including Q161's `UGGTUTCGCAT`, remain unchanged.

The original PDF is hosted by a third party; a surviving official-hosted question-paper URL was not located. The 42-page BYJU'S reproduction identifies 2018 AA / ACHLA and provides corroborating exam/booklet attribution, but is not treated as an official-hosted original or a byte-identical independent archive.

## Answer evidence and why activation is blocked

The CareerIndia archive contains an AA / ACHLA key page headed with exam date 06/05/2018 and printed date **30/05/2018**. All 180 printed tokens were extracted and visually checked. Watermark interference at Q124 and Q164 was corrected against the rendered source page; the candidate tokens are respectively 3 and 2. The ordered-token SHA-256 is `29e2c4fa066ac46fd5dca413a41215cbc0c4b920835976f1829bd1ed656a3893`.

This PDF does not supply a verified official publication chain or independently authenticated final-status evidence. The historical CBSE welcome endpoint was inaccessible during source discovery. A later printed date alone cannot prove that the archive represents the final key used for results. Consequently every answer remains a **candidate**, and every source slot is quarantined.

A different mirrored key dated **20 May 2018**, also labelled AA / ACHLA, has extensive mismatches against this English booklet. It was rejected rather than mixed into the selected paper. The downloaded BYJU'S coaching key was compared across all 180 answers with the 30 May candidate: Q27 differs (candidate 4, coaching 3) and Q50 differs (candidate 3, coaching 1). Both carry an additional conflict reason. Coaching agreement on other questions does not authenticate an official final key. No answer was guessed or selected by majority vote.

## Sources and fingerprints

| Source | Role / limitation | SHA-256 |
| --- | --- | --- |
| [Unacademy-hosted original English AA booklet](https://unacademy.com/content/wp-content/uploads/sites/2/2022/10/neet-2018-question-paper-code-AA.pdf) | Reviewed wording and diagrams; third-party archive, 24 pages | `305e91121edf28e563a8fb283f7a866a1f1fed9ee3430719e1292e6415f556b4` |
| [BYJU'S AA paper reproduction](https://cdn1.byjus.com/neet/wp-content/uploads/2018/07/28070559/NEET_2018_Question_Paper_AA.pdf) | Corroborating 2018 / AA / ACHLA attribution; 42-page reproduction | Not used as the transcription input |
| [CareerIndia 30 May key archive](https://www.careerindia.com/exam/neet-ug-all-sets-question-paper-answer-key-2018-846.pdf) | Candidate answer binding, page 1; official final authority unresolved | `81c2560e11580dcbc39126486b76a3c0560276b3a824f9c78d8f834b4256bc9e` |
| [BYJU'S coaching AA key](https://cdn1.byjus.com/neet/wp-content/uploads/2018/07/28070541/NEET_2018_Answer_Key_Code_AA.pdf) | Conflict detection only; not official authority | `fc15eea160931f391089ac197d6765384f469e8d7af973cd109bf01ba5b7ed52` |
| [Rejected 20 May key mirror](https://static.collegedekho.com/media/uploads/2022/07/15/neet-answer-key-2018-english-code-aa.pdf) | Incompatible answer mapping; excluded from staging answers | `e09ce4b74d1ef4e694b12bec152bfc44636ddf38b6bd7b0fd78d4ac8d81176f7` |
| [Historical CBSE welcome endpoint](https://cbseneet.nic.in/cbseneet/Welcome.aspx) | Inaccessible; no official final-key authentication obtained | No downloaded artifact |

## Quarantine reasons and remaining work

Counts overlap; they must not be added as separate coverage totals.

| Reason | Count | Printed question numbers |
| --- | ---: | --- |
| Official final-key publication chain unauthenticated | 180 | 1–180 |
| Diagram/structural options awaiting supported question rendering | 13 | 1, 7, 15, 17, 30, 35, 39, 52, 64, 66, 68, 81, 90 |
| Vector-arrow glyph rendering unresolved | 0 | Q12, 18, 34, 36 resolved with explicit linear notation |
| Canonical taxonomy gap: mineral nutrition | 2 | 95, 97 |
| Normalized stem collision requiring full-question review | 2 | 109, 130 |
| Candidate/coaching key conflict | 2 | 27, 50 |

Q109 collides with Q102 within this paper on the generic stem “Select the correct match :”. Q130 collides with stored NEET 2021 M4 Q144 on “Which of the following statements is correct ?”. These are stem collisions, **not proven identical full-question duplicates**. Options and context must be reviewed before resolving them. The duplicate scan covered existing NEET 2019/2020 staging, NEET/JEE 2021–2025 datasets, question-bank JSON/CSV, the NEET 2025 template and earlier transcribed slots within this paper. No database duplicate query occurred.

Completion requires authenticated official final-key evidence for this exact booklet, resolution of the two key conflicts, supported diagram rendering, accurate taxonomy resolution and editorial duplicate review. No record should be activated from this batch as delivered.

## Validation and reproducibility

- `tsx scripts/prepare-neet-2018-staging.ts`: deterministic local replay of frozen manual transcriptions, source-slot ledger and candidate key. Source PDF hashes are checked when temporary downloads are present; no OCR output is required for replay.
- Focused suites: `neet-2018-staging`, `neet-2019-staging`, `neet-2020-staging`, `previous-year-modes`, `neet-historical-dataset`, `historical-matrix`: **31 tests passed**. Safeguards cover identity accounting, unverified-key isolation, inactive quarantine state, option-order/notation fixtures, taxonomy, duplicates, content hashes, authentication ledger and diagram evidence.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed. Build generated 144 static pages. Existing workspace-lockfile inference, Next lint deprecation, Vitest configuration and OpenTelemetry dynamic-dependency warnings remain.
- `node scripts/preview-neet-2018-staging.mjs`: 167 transcribed question texts, 668 options and 13 original diagram images checked at **360 px** and **1100 px**. No horizontal overflow, missing image or changed DOM text; radio selection passed. Screenshots and machine-check results are under `evidence/`.
- Visual notation review: Q12, Q18, Q34 and Q36 use explicit `vec(X)` in recovered staging text to avoid the unsupported U+20D7 glyph. Both screenshots were visually inspected alongside automated DOM checks. Original glyph transcriptions remain frozen and copied into each affected record's notation metadata.
- Preview scope is local quarantine review using the existing whitespace/wrapping semantics. Authenticated student practice, filter integration, results and scoring E2E were not exercised because no new content is eligible for publication.
- 2019/2020 staging, scripts, tests and reports have no diff against parent `57dc25b`. No approved 2021–2025 content, Full Mock 1, scoring, attempts/results, Admissions, Multilingual, importer or release manifest was changed.
- Temporary downloaded PDFs, extracted PDF text and processing scripts remain ignored under `tmp/neet-2018/`; they are not committed. Frozen manual transcriptions, source fingerprints, source-slot coordinates, original evidence crops and deterministic replay are retained for review/reproducibility.

No production database writes, push, merge, deployment or production import occurred. Processing stopped at NEET 2018 with the official-key source blocker explicitly recorded and four vector-glyph cases resolved.
