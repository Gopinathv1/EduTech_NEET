# AIPMT 2014 English — official final key authenticated

Review completed 10 October 2026 on `codex/english-pyq-2013-2020`, based on `4aace7038d2a8fedede974523bf2b78105d3d630`.

SOURCE STATUS: **Official CBSE final key authenticated. English code-R original booklet scan recovered from a third-party archive; the scan has cropped content.**

PAPER CODE: **R**, 4 May 2014. Authority: **Central Board of Secondary Education (CBSE)**. Other final-key pages are P/Q/S; none is used for R answers.

QUESTIONS VALIDATED / APPROVED / STUDENT-VISIBLE: **0 / 0 / 0 new records**. Source authentication is not completed content validation or approval. No importable 2014 question dataset or quarantine batch was created.

## Primary authentication evidence

The [archived official CBSE AIPMT welcome page](https://web.archive.org/web/20140610000000id_/http://aipmt.nic.in/aipmt/Welcome.aspx) labels its link **AIPMT Final Answer Key** and points to `docs/AIPMT14_FINAL_KEY.pdf`. The [linked four-page official PDF](https://web.archive.org/web/20140610000000id_/http://aipmt.nic.in/aipmt/docs/AIPMT14_FINAL_KEY.pdf) explicitly identifies **AIPMT FINAL KEYS 2014**, exam date **04/05/2014**, and individual booklet codes P, Q, R and S. Page **3** is R and contains a complete Q1–180 table. Both the official referring page and the document establish final status, unlike an unlabelled answer table or coaching claim.

The [English R paper scan](https://www.resonance.ac.in/answer-key-solutions/AIPMT/2014/Solutions/CODE-R-English.pdf) is linked from the [publisher's contemporaneous paper index](https://www.resonance.ac.in/answer-key-solutions/AIPMT/2014/Answer-Key-Solution.aspx). Its cover identifies R, serial 4320843, 180 questions and 20 printed pages. The PDF contains 19 pages, ending with Q180. Biology precedes Physics and Chemistry in this variant: Q1–90 Biology, Q91–135 Physics, Q136–180 Chemistry. Do not apply the question order from another booklet.

The key's special token **9** means four marks to all candidates. In R it occurs at **Q28, Q170 and Q175**. It is not option 9, an inferred single answer, or permission to alter scoring. These items require quarantine if content staging resumes under the current single-correct infrastructure.

The separately recovered [CBSE-hosted earlier table](https://www.cbse.gov.in/attach/aipmtkey2014.pdf) is headed only “ANSWER KEY FOR AIPMT - 2014.” It is **not substituted** for the explicitly final artifact; the two files have different hashes and content. Authentication here relies on the official final-labelled publication chain.

## Fingerprints and preserved evidence

| Artifact | SHA-256 |
| --- | --- |
| Official final P/Q/R/S PDF | `847da9c9a8e07b43d19e7ff14bd8b70236c9df25f7ba41dd867a15ff5e7c9f6c` |
| Original English code-R scan | `4e8d5d95a74e5e59d7db1de3238d51bca927c9fac5709f8bfbafe0201018ab72` |
| Earlier unlabelled CBSE table, not used | `bdf06d0e7b3d98d01488ccad63fa83a110c7aa3c41a14c52f5c636d3c2ad3d50` |

The official final PDF, rendered R key page and all 180 R key tokens are sealed under `data/previous-year/neet/2014/` in `source-gate.json` and `evidence/`. Key numbering and printed token extraction were checked against the rendered R table. Question wording was visually inspected on the scanned pages; complete question-to-answer transcription alignment has **not** been certified.

## Remaining content blockers

- The scan crops the starts of Q85/Q91 on page 9 and Q117/Q121 on page 13; some later pages also cut text at the right edge. A complete clearer copy of the same R booklet is required for those records. The absent twentieth PDF page has not been identified; no completeness claim follows from the presence of Q180.
- Diagrams, structural chemical options, matching tables, vectors and isotope notation need complete verified rendering. Handwritten selections on the scan are not answer authority.
- Before the product direction changed, all 18 question-bearing PDF pages were inspected and OCR acquired. **111 draft transcriptions** were prepared locally; they remain unvalidated ignored working files under `tmp/historical-2013-2014/`, not staged or approved content. They are retained to avoid repeating transcription. No temporary OCR or draft transcription files are committed.
- The current task completes this source gate and reconciles existing validated 2019–2025 content. 2014 content staging and approval remain a separate unfinished content step; the release package contains no 2014 questions.

TEST RESULTS: Refer to `reports/neet-2013-2025-release-readiness.md` for the shared focused tests, typecheck, lint, build and navigation/rendering previews. No 2014 student practice is activated. NEET 2015–2020 investigations and content remain unchanged. No production writes, automatic approval, push, merge or deployment.

COMMIT: Included in the local NEET readiness commit; hash returned on delivery.
