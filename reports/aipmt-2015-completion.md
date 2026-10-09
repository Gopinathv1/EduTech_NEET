# AIPMT 2015 English re-test — source gate blocked

Review date: 9 October 2026. Branch: `codex/english-pyq-2013-2020`. Starting checkpoint: `cbbcbf9591834be4427ea1a3e2712c05a79b45a1`.

RE-TEST FINAL KEY AUTHENTICATED: **No — BLOCKED.** Official CBSE challenge and result notices were recovered, but no corresponding numbered final answer key was authenticated.

PAPER CODE: **C, candidate re-test scan only; no authenticated paper/final-key pair.** Cancelled original exam reproduction: **F**, kept separate.

QUESTIONS VALIDATED: **0**.

QUESTIONS QUARANTINED: **0**. No question records or quarantine batch created.

QUESTIONS UNPROCESSED: **180 expected slots for one re-test booklet**, based on its cover. No bulk extraction or transcription began. Cancelled-exam questions are excluded from this count. Approved and student-visible additions: **0**.

TEST RESULTS: **31 focused tests passed across six suites; typecheck, lint and build passed.** No browser previews: no new staging content exists. Duplicate and question-rendering checks are inapplicable because no questions were extracted.

COMMIT: Report-only local commit; resulting hash returned on delivery.

REMAINING BLOCKERS: Obtain an authentic CBSE final numbered re-test key with exact code-C answer alignment, and establish completeness and provenance of the English booklet. Do not use a coaching key, the cancelled May examination key, or the challenge notice as final-answer authority.

## Separate examination identities

| Examination | Date | Inspected paper evidence | Decision |
| --- | --- | --- | --- |
| Original AIPMT 2015, cancelled | 3 May 2015 | ALLEN reproduction/solutions, code F, dated 3 May on its cover | Excluded; coaching answers are not final-result answers |
| AIPMT 2015 re-test | 25 July 2015 | Scanned booklet cover, code C, serial 1105367; 180 questions, 720 marks, three hours | Candidate only; final-key gate failed |

The [CBSE disclosure document](https://www.cbse.gov.in/cbsenew/rti/disclosures/08-07-2015.pdf), PDF pages 14 and 85, distinguishes the May examination, its cancellation under Supreme Court orders, the July re-test and the 17 August result. CBSE was the issuing authority. The paper candidates below are third-party copies, not recovered official-hosted original booklets. The code-C PDF has **19 PDF pages although its cover states 20 printed pages**; no conclusion about missing question slots is possible without page-by-page verification. Cover identity was visually inspected; complete English wording, diagrams and question numbering were not validated.

## Official evidence and failed final-key gate

- [Archived official welcome page](https://web.archive.org/web/20150820000000id_/http://aipmt.nic.in/aipmt/Welcome.aspx) links the re-test challenge notification and result press release. The [official downloads archive](https://web.archive.org/web/20150820000000id_/http://aipmt.nic.in/aipmt/ArchiveDownload.aspx) includes a key-challenge user manual, which is not an answer table.
- [CBSE re-test challenge notice, 8 August 2015](https://web.archive.org/web/20150820000000id_/http://aipmt.nic.in/aipmt/ShowPdf.aspx?Type=E0184ADEDF913B076626646D3F52C3B49C39AD6D&ID=B7103CA278A75CAD8F7D065ACDA0C2E80DA0B7DC): explicitly concerns the 25 July re-test. It schedules candidate-login answer-key display/challenges from **12 August, 10 am to 13 August, midnight**, with OMR challenges separately on 10–11 August. It contains no numbered answers. Its statement that CBSE's challenge decision is final does not authenticate a final key.
- [CBSE result press release, 17 August 2015](https://web.archive.org/web/20150820000000id_/http://aipmt.nic.in/aipmt/ShowPdf.aspx?Type=E0184ADEDF913B076626646D3F52C3B49C39AD6D&ID=C097638F92DE80BA8D6C696B26E6E601A5F61EB7): confirms the 25 July re-test and result declaration, but supplies no numbered final key or code-C mapping.
- A [2015 Internet Archive PDF index query](https://web.archive.org/cdx/search/cdx?url=aipmt.nic.in/aipmt/*&output=json&filter=mimetype:application/pdf&filter=statuscode:200&from=2015&to=2015&collapse=urlkey) returned 58 distinct archived official PDF URLs. All six candidates whose first listed captures were in August were inspected: the two notices above, the **18 May cancelled-exam challenge notice**, an unrelated 2014 correction notice, a 28 July vigilance notice and a 19 August admit-card notice. None supplies a re-test final answer table. First-capture dates do not establish document dates. This was targeted discovery, not an exhaustive review of all 58 artifacts or every archive revision; failure to recover a key does not prove it never existed.

**Question-number and answer alignment remain unverified.** No key tokens, inferred options or numerical answers were copied into staging.

## Candidate copies and reproducible fingerprints

SHA-256 hashes identify inspected download bytes; they do not certify authority or completeness.

| Artifact | Source | SHA-256 |
| --- | --- | --- |
| Re-test code-C scan, 19 PDF pages | [PDF](https://elearnersparadise.wordpress.com/wp-content/uploads/2015/07/aipmt-2015-retest-code-c-question-paper.pdf), [25 July source post](https://elearnersparadise.wordpress.com/2015/07/25/aipmt-2015-retest-question-paper-answer-and-solution/) | `2eb8f916390555aa620ac34af3f00336ae4e9eaa62ec31fe8c36422e561a5d86` |
| Cancelled original code-F coaching reproduction, 26 PDF pages | [ALLEN paper/solutions](https://myexam.allen.in/wp-content/uploads/2015/06/AIPMT2015-Paper-Solutions-ALLEN.pdf) | `f3acbeeebb57ec35417144a44d760af522676ec71987d80f99cb6c02d8e5b1a9` |
| Official re-test challenge notice | Archived CBSE link above | `97acb7c6a24c6276de308d3f93975443866b506374587789e0f7e1353b1d168d` |
| Official re-test result release | Archived CBSE link above | `a6cf562d5686cef975a2fecf6645785dadc44de3c0855e000a5e75f150a64228` |

Other discovery leads reviewed: [BYJU'S 2015 paper index](https://byjus.com/neet/neet-2015-question-paper/), [Education Observer re-test discussion](https://www.educationobserver.com/forum/showthread.php?tid=19009), and [Resonance code-D coaching key](https://www.resonance.ac.in/answer-key-solutions/aipmt/2015/Answer-Key/Answer-Key-RE-AIPMT-2015-Code-D.pdf). These do not authenticate an official final code-C key. The discussion's attachment date differs from the official re-test date; it was not used to bind answers.

## Validation and preservation

- Focused suites: `neet-2018-staging`, `neet-2019-staging`, `neet-2020-staging`, `previous-year-modes`, `neet-historical-dataset`, `historical-matrix`: **31 tests passed**.
- `npm run typecheck`: passed. `npm run lint`: passed with no ESLint errors/warnings. Existing Next lint deprecation, workspace-lockfile inference and Vitest configuration notices remain.
- `npm run build`: passed; 144 static pages generated. Existing OpenTelemetry dependency-expression warnings remain. No migration or deployment command used.
- Only this report is committed. Downloaded source PDFs, archive HTML/index and inspection PNGs remain ignored under `tmp/aipmt-2015/`. No OCR/transcription files are committed.
- NEET 2016–2020 staging and reports, all question datasets, existing tests and infrastructure remain unchanged from the starting checkpoint.
- No production writes, imports, approved-content changes, Admissions or Multilingual changes, push, merge or deployment. Processing stopped at the source gate as requested.
