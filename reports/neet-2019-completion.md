# NEET (UG) 2019 P1 English staging completion

SOURCE VERIFIED: Original P1 booklet scans in two public archives; matching official NTA final answer key for 5 May 2019, P1, page 1. An official-hosted question-paper URL was not located. This is an explicit source-provenance limitation, not a claim that either mirror is an NTA website.

QUESTIONS EXTRACTED: All 180 printed slots, numbers 1–180, on booklet/PDF pages 2–41. Of these, 166 have complete manual English text/option transcriptions. OCR alone is never treated as validated content.

QUESTIONS VALIDATED: 156 source-page-reviewed, single-answer, taxonomy-valid, repository-collision-free questions. All remain inactive and require editorial approval.

QUESTIONS QUARANTINED: 24. Full source references, printed numbers, source pages, official accepted answers and proposed classification are retained. Original diagram/typography crops are preserved for the 14 items without complete validated transcriptions.

QUESTIONS UNACCOUNTED: 0 source slots. There are still 24 questions missing from usable validated coverage; this paper is **PARTIAL_UNPUBLISHED**, not complete for student practice. Approved: 0. Student-visible: 0.

TEST RESULTS: 23 focused tests passed across five suites; typecheck, lint, build and local mobile/desktop staging previews passed.

COMMIT: Local commit containing this report on `codex/english-pyq-2013-2020`; parent workflow checkpoint `2794d4900c0cc569057d879a79fc035babbe768b`. The exact resulting commit ID is returned with delivery.

## Exact paper and answer binding

The selected paper is **NEET (UG) 2019, 5 May 2019, booklet P1**, Hindi–English printed booklet, with only its original English right-hand column transcribed. It has 180 compulsory questions: Physics 1–45, Chemistry 46–90 and Biology 91–180. It is not the 20 May re-examination or another P/Q/R/S booklet.

The P1 cover identifies the code, 44-page booklet, 180-question pattern and English precedence. AglaSem's archived scan supplies the reviewed question pages; the separately hosted original scan supplies a readable cover and corroborates opening page wording/numbering. Matching cover/code and sampled opening pages do not establish a byte-identical or independent official archive chain. Both PDF hashes are recorded.

The official key explicitly identifies P1 and exam date 05.05.2019. Its 180 printed key tokens were extracted and visually checked on the rendered key page. The ordered-token SHA-256 is `2091c67d7ee31c9f153cb4d1cbcb981efd3f46b8f970a3e77011073a651ded8c`.

For this exact booklet, Q6 has official token **F**, meaning printed options **3 and 4**; Q72 has official token **A**, meaning printed options **1 and 2**. Both are quarantined. Neither has been reduced to one guessed answer. The historical key's complete A/C/D/F legend is preserved in `final-answer-key.json`. Other retained answers bind printed 1/2/3/4 to staging A/B/C/D without reordering options.

## Sources

| Reference | URL | Role |
| --- | --- | --- |
| Archived booklet index | [AglaSem NEET 2019 English/Hindi, 5 May](https://docs.aglasem.com/view/c925b19e-2d88-11eb-8a1a-02f21f5619c4) | Third-party archive identifying the selected exam/date |
| Reviewed original booklet scan | [P1 PDF](https://cdn.aglasem.com/aglasem-doc/c925b19e-2d88-11eb-8a1a-02f21f5619c4/c925b19e-2d88-11eb-8a1a-02f21f5619c4.pdf) | English source pages, 44-page scan; cover is blank in this copy |
| Corroborating booklet scan | [OldYearPaper P1 PDF](https://www.oldyearpaper.com/portal/Neet_paper_2019_shift2_05052019.pdf) | Readable original P1 cover and sampled opening pages; third-party scan with overprint |
| Official final answer key | [NTA final keys](https://www.nta.ac.in/Download/Notice/20190605125750.pdf) | Authoritative answer binding; P1 is PDF page 1 |
| Official notice archive | [NTA Notice Board Archive](https://www.nta.ac.in/NoticeBoardArchive) | Lists NEET (UG) 2019 Final Answer Key |

Pinned SHA-256 values:

- Reviewed booklet: `8b10964cf8bd9f11a31b86edc480094951d65aa37e10c650290f89a2630c8f42`.
- Corroborating scan: `9d9b3b0083ea01d7b9034759db59a2ff189ea384b2f8c49a2e4175832eb8d9f5`.
- Official key PDF: `fdb593f365502c8e1aff61901eafbb2ddd235879d0ca651eb7ecd481b0275769`.

Source PDFs were downloaded only to ignored local temporary storage. The versioned dataset contains provenance, hashes, transcriptions, extraction evidence, cover/key images and quarantine source crops.

## Coverage and quarantine

| Subject | Printed slots | Validated | Quarantined |
| --- | ---: | ---: | ---: |
| Physics | 45 | 37 | 8 |
| Chemistry | 45 | 36 | 9 |
| Botany classification | 55 | 50 | 5 |
| Zoology classification | 35 | 33 | 2 |
| Total | 180 | 156 | 24 |

Botany/Zoology are staging classifications within the printed 90-question Biology section, not separately printed sections.

| Reason | Printed question numbers | Count | Remaining work |
| --- | --- | ---: | --- |
| Diagram, graph or structural formula/options not staged | 17, 24, 33, 39, 42, 45, 47, 48, 55, 65, 69, 74, 78 | 13 | Review and bind complete original visual assets through the question rendering infrastructure; no diagram substitutions were invented |
| Scientific-name typography not staged | 144 | 1 | Preserve original italic/roman distinctions in the options; source crop retained |
| Official multiple accepted answers | 6, 72 | 2 | Editorial decision for the existing single-correct staging schema; do not change scoring as part of this task |
| Canonical taxonomy gap | 14, 73, 131 | 3 | Accurate mappings for thermal expansion, chemistry in everyday life/medicines and mineral nutrition; no forced nearby topic |
| Normalized-stem collision requiring review | 110, 124, 156, 159, 164 | 5 | Compare complete question/options and identities before resolving generic-stem collisions |

Q110 collides with the 2021 M4 Q123 stem; Q156 and Q159 with the 2021 M4 Q136 stem; Q164 with the 2021 M4 Q144 stem. Q124 collides with this P1 paper's Q121 generic stem. These are conservative **stem collisions**, not assertions that the complete questions are duplicates. Recovered manual text/options and all matched identities remain in quarantine.

Duplicate checks use the existing `questionTextHash` against 2021–2025 NEET/JEE PYQs, NEET 2020 staging, every repository question-bank JSON/CSV, the NEET 2025 template and earlier retained P1 questions. No retained exact normalized-stem collision remains. Semantic, OCR-spelling and production-database duplicate checks still require a later authorized review; the database was not contacted.

## Staging and review batches

The existing `2794d49` local staging workflow was reused in a separate 2019 assembler. Source-page review preserves original wording, spelling, printed option order, numerical values, Greek letters, subscripts/superscripts and sequence direction. Display fractions are linearized with explicit grouping; unavailable Latin subscripts use underscores. Matching-column tables retain all labels and their option order as explicit line-separated lists. Source claims are retained even when they are incorrect distractors.

The 156 retained questions use `HISTORICAL_VERIFIED`, `VALIDATED`, `REVIEW_REQUIRED`, `status: REVIEW`, and `isActive: false`. Quarantine uses `QUARANTINED`, `DRAFT`, and `isActive: false`. No approval or activation occurred. The manifest declares `importReady: false`, `published: false` and `productionImportAuthorized: false`.

Seven review batches are listed in `source-manifest.json`: six of 25 and one of 6 questions. Their IDs are `neet-2019-p1-01` through `neet-2019-p1-07`.

Local reproduction, after obtaining the pinned PDFs:

```powershell
# tmp/neet-2019-rebuild must contain booklet.pdf and final-key.pdf with the pinned hashes.
# Versioned reviewed transcriptions, key and raw extraction are the fallback inputs.
../node_modules/.bin/tsx.cmd scripts/prepare-neet-2019-staging.ts tmp/neet-2019-rebuild
node scripts/preview-neet-2019-staging.mjs
```

The assembler loads no environment, database client or importer and makes no network calls. It writes only the 2019 staging directory. The preview renders only local HTML.

## Validation and limits

- Focused content/regression suites: `neet-2019-staging`, `neet-2020-staging`, `previous-year-modes`, `neet-historical-dataset`, `historical-matrix`: **5 suites, 23 tests passed**.
- `npm run typecheck`: **passed**. An initial local dependency junction caused two Next.js type identities; repairing ignored worktree dependency wiring resolved it without application-code changes.
- `npm run lint`: **passed**, no ESLint warnings/errors. Existing Next lint deprecation/workspace-root notices remain.
- Local staging preview: **passed** at 360px and 1100px for all 156 stems and 624 options. Exact rendered text, absence of horizontal overflow and radio selection were checked. Saved previews cover fractions, matching tables, orbital configuration, long sequences and mRNA notation; screenshots were visually inspected.
- `npm run build`: **passed**, 144 static pages generated. Existing OpenTelemetry dynamic-dependency and multiple-lockfile workspace-root warnings remain. Only `next build` was invoked; no migration/deploy command.
- NEET 2020 staging, assembler, tests and completion report were checked against `2794d49` and remain unchanged.
- Rebuilding from the two pinned PDFs and versioned fallback review/key/extraction inputs produced identical hashes for all six staging JSON files.

The preview is not authenticated application practice/scoring E2E, and no claim of production/mobile-device certification is made. Existing filters/practice regression tests passed, but 2019 availability was not enabled. Full Mock 1, approved content, student attempts/results, scoring, Admissions, Multilingual, existing importers/release manifests and the production database were not changed. No push, merge or deployment was performed.

Release readiness: **unpublished editorial review only**. Resolve the 24 quarantine items, official-hosted paper provenance gap, final duplicate review and authorized approval/import gates before student release. Processing of this selected P1 paper is finished; full validated coverage and release readiness are not claimed.
