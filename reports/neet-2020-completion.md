# NEET 2020 English E1 processing completion report

Branch: `codex/english-pyq-2013-2020`. Scope: main examination on **13 September 2020**, English booklet **E1** only. This processing pass is complete; the question bank remains **partial and unpublished**.

| Measure | Count |
|---|---:|
| Official printed questions | 180 |
| Source blocks extracted with OCR and numbered page/column bindings | 180 |
| Complete manual English transcriptions checked against source images | 152 |
| Validated staging questions | 147 |
| Quarantined source records | 33 |
| Missing/unaccounted source question numbers | 0 |
| Questions still unavailable as validated practice content | 33 |
| Approved / activated / imported | 0 / 0 / 0 |

OCR extraction is not accuracy validation. The 147 retained questions are a subset of the 152 complete manual transcriptions. The other five complete transcriptions are quarantined for taxonomy or normalized-stem collision review. The remaining 28 quarantine records retain raw OCR evidence and source locations; their options/layouts are not approved transcriptions. Zero missing source numbers does not mean 180 usable questions.

Validated subject counts: Botany **42**, Zoology **30**, Chemistry **36**, Physics **39**. Biology occupies E1 Q1–90, Chemistry Q91–135, Physics Q136–180. Botany/Zoology and chapter/topic assignments are SIVORA classifications, not printed NTA subdivisions. Six review batches contain at most 25 retained records each.

## Authenticity and key alignment

- [Official NTA archive](https://neet.nta.nic.in/archive/) lists **English Set E1 NEET QP 2020**.
- [Official English E1 paper](https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2022/02/2022021555.pdf): 24 scanned pages; cover explicitly states E1 and 180 questions; questions run 1–180 on printed/PDF pages 2–21. Pages 22–23 are rough-work pages. [Cover evidence](../data/previous-year/neet/2020/evidence/booklet-cover.png).
- [Official NTA final key](https://www.nta.ac.in/Download/Notice/Notice_20201016104324.pdf), linked from the [NTA notice archive](https://www.nta.ac.in/NoticeBoardArchive), has **BOOK: E1**, **EXAM DATE: 13.09.2020** and the final-key declaration date **16.10.2020** on PDF page 1. All 180 entries are single printed options 1–4. [Key evidence](../data/previous-year/neet/2020/evidence/official-e1-final-key.png).
- Mapping is by original E1 question number, with printed options 1/2/3/4 mapped to A/B/C/D. No option reordering, answer solving, coaching-key substitution or inferred answer was used.

Paper SHA-256: `5b6d11dfaa2918e6e638da7a178cbc41a26573967e76c6d1f0e352d533f715f4`.

Final-key PDF SHA-256: `54280c1c2ef1684e444b521e7eca228c4cc792d7bbcf692cebca3dff53b729f9`.

The assembler pins both reviewed source hashes and a digest of the exact 180-answer E1 sequence. It refuses changed source PDFs or changed key extraction.

## Quarantine and remaining blockers

| Gate | Questions | Count |
|---|---|---:|
| Matching-table transcription/layout not validated | 4, 9, 27, 28, 30, 37, 48, 52, 55, 60, 62, 70, 76, 80, 84, 96, 130, 131 | 18 |
| Diagram, graph, chemical structure or truth table not staged | 95, 102, 133, 135, 160, 163, 164, 180 | 8 |
| Vector/fraction notation transcription not validated | 149, 155 | 2 |
| Existing canonical taxonomy lacks an accurate topic | 13 (mineral nutrition/nitrogen fixation), 113 (detergents/chemistry in everyday life) | 2 |
| Normalized stem collision needs editorial review | 35, 77, 126 | 3 |

The three stem collisions are conservative import gates, **not a claim of three duplicate full questions**. In particular, generic identical stems can have different options. Collision evidence records the existing owner or earlier staged owner. No existing record was replaced or merged.

Repository duplicate checks use the existing `questionTextHash` normalization against all 2021–2025 NEET/JEE question files, every question-bank JSON/CSV file (including Full Mock content), the NEET 2025 template and earlier retained 2020 candidates. There are zero retained normalized-stem collisions and zero repeated external identities. Semantic duplicates with different wording and database-only records need final editorial/database preflight before any future import. No database was contacted in this phase.

## Content fidelity and staging

Question wording, source spelling, option ordering and official answers are retained. Incorrect statements printed as distractors remain incorrect; they were not edited into textbook statements. Superscripts, subscripts, charges, Greek letters, DNA strand directions and powers of ten use Unicode text. Display fractions are linearized with explicit grouping. Latin subscripts without Unicode equivalents use an underscore (`K_c`, `K_f`, `k_B`, `i_b`, `Δ_r`); these are documented typesetting adaptations, not new mathematical values. No HTML/LaTeX is placed into the plain-text question renderer.

Files are staged under `data/previous-year/neet/2020/`. Only `questions.json` contains validated candidates. `raw-extraction.json` is unreviewed OCR; `reviewed-transcriptions.json` includes quarantined working transcriptions; neither is an import payload. `quarantine.json` records every excluded identity and reason. `source-manifest.json` records provenance, counts, source hashes and batch membership. The 2021–2025 production release manifest, historical matrix, production import/approval selections and student filter availability were deliberately not extended.

All retained questions have `status: REVIEW`, `reviewState: REVIEW_REQUIRED`, `isActive: false`. Quarantine records have `validationState: QUARANTINED` and `isActive: false`. No record is approved or student-visible. `source-manifest.json` explicitly sets `importReady: false` and disallows production import.

## Validation

- Focused staging, existing historical content, approval, fixed Full Mock and PYQ-mode checks: **5 suites / 22 tests passed**. Tests cover exact E1 key digest, numbering partition, option count, source binding, taxonomy, inactive state, batching, duplicate gates and vulnerable notation.
- Typecheck: **passed** (also passed during the final build).
- Lint: **passed**, with existing Next lint deprecation/workspace-root warnings.
- Local rendering checks at **360 px** and **1100 px**: option strings preserved; no horizontal overflow for DNA, ligand charges, isotope notation and scientific powers. [Mobile evidence](../data/previous-year/neet/2020/evidence/render-mobile.png), [desktop evidence](../data/previous-year/neet/2020/evidence/render-desktop.png). This is a staging preview using existing ExamClient whitespace/wrapping semantics, not an authenticated practice-flow E2E test.
- Build: **passed**, all 144 static pages generated. Existing OpenTelemetry dynamic-dependency/workspace-root warnings remain.

Regeneration from versioned review inputs produced identical question content. A substituted source PDF was rejected before any content write.

To regenerate locally, download the two exact source PDFs into a temporary directory as `paper-e1.pdf` and `final-key.pdf`, then run `npx tsx scripts/prepare-neet-2020-staging.ts <temporary-directory>`. The assembler reuses versioned review/key/OCR inputs when working extraction files are absent. It reads and writes local files only, never loads database credentials, and cannot import or approve records.

The remaining 33 questions need the specific quarantine gates above resolved before they can become validated practice content. Human approval and a database duplicate preflight are still required before a later authorized import. Other English booklet permutations and the October 2020 re-examination are outside this E1 phase.

No approved 2021–2025 content, Full Mock, student attempt/result, scoring, Admissions or Multilingual files changed. No push, merge, deployment or production write was performed.
