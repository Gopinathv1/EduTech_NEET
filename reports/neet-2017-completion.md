# NEET (UG) 2017 English source gate — BLOCKED

Review date: 9 October 2026. Branch: `codex/english-pyq-2013-2020`. Starting checkpoint: `067e0a73e78a49704a95f08cfa944fe553fa3402`.

OFFICIAL KEY AUTHENTICATED: **Official origin authenticated; final status not authenticated — BLOCKED.** Processing stopped at Phase 1. No bulk extraction, transcription, answer assignment, content staging or quarantine batch was started.

PAPER CODE: **C / APRA**, candidate booklet identity confirmed on the downloaded reproduction's cover and first question page. The source is bilingual English/Hindi; only its English column would be eligible for a future English batch. This is an investigated candidate, not an authenticated final-key/paper pair. No A, B, D or regional variant was substituted.

QUESTIONS EXTRACTED: **0**. Cover/identity inspection only; no question-slot ledger was created.

QUESTIONS VALIDATED: **0**.

QUESTIONS QUARANTINED: **0**. No 180-question quarantine batch or 2017 question dataset was created.

QUESTIONS UNACCOUNTED: **180 expected slots remain unprocessed**, rather than zero missing questions. The candidate paper reaches printed Q180; no full slot-by-slot completeness claim is made before the gate passes. Approved and student-visible additions: **0**.

TEST RESULTS: **31 tests across six existing historical staging regression suites passed; typecheck, lint and build passed.** Build generated 144 static pages. Existing workspace-lockfile inference, Next lint deprecation, Vitest configuration and OpenTelemetry dependency warnings remain. New 2017 content tests, duplicate scans, answer-alignment verification and desktop/mobile question previews are **not applicable: no 2017 content was staged**. Phase 2 and content-specific Phase 3 checks did not run.

COMMIT: Local report-only commit based on the checkpoint above; resulting hash returned with delivery. No push, merge or deployment.

REMAINING BLOCKERS: Evidence establishing that the recovered official **CBSE answer key is final**, rather than an unlabelled or challenge-stage key, for the exact C/APRA English question order. A final-status notice or explicit result-key binding must also establish any withdrawn/multiple-answer treatment. Neither a mirror label, a printed date, PDF metadata nor coaching agreement establishes this. Official origin alone does not clear this gate.

## Authority and final-status evidence

CBSE's [official result press release](https://www.cbse.gov.in/cbsenew/Press_Notes/2017/PRESS%20RELEASE%20-%20NEET%20(UG)%202017%20RESULT.pdf), linked from its [press archive](https://www.cbse.gov.in/cbsenew/press_archive.html), confirms CBSE conducted NEET (UG) on 7 May 2017. Page 4 explains that keys were made available for challenges and those challenges were addressed before preparing results. It supplies no final numbered answer table or link authenticating the candidate key bytes. The [official 2017 results archive](https://results.cbse.nic.in/cbseresultsarchives2017/) dates the result announcement to 23 June 2017. NTA attribution on third-party archive templates is not accepted as the 2017 issuing authority.

The downloaded 29-page key has APRA set A on page 1 and APRA set C on page 3. Page 3 has numbered rows spanning 1–180, structurally matching the candidate booklet code. **Structural numbering is not final answer validation.** No answers were copied into question records or approved. The mirror advertises the key as final and describes token 5 as no correct option; those statements remain archive claims, not authenticated final marking rules.

A direct Internet Archive CDX request succeeded after research-tool access failed. It returned 121 distinct official-domain PDF URLs captured during 2017. Five URLs first captured after the result date were downloaded for identity inspection: two result notices, two 15-page documents and one 29-page answer key. The [official key capture](https://web.archive.org/web/20170708093753id_/http://cbseneet.nic.in:80/cbseneet/ShowPdf.aspx?Type=50C9E8D5FC98727B4BBC93CF5D64A68DB647F04F&ID=667BE543B02294B7624119ADC3A725473DF39885) is byte-identical to the SolveIt mirror. The [archived official welcome page](https://web.archive.org/web/20170708000000id_/http://cbseneet.nic.in/cbseneet/Welcome.aspx) links the same official `ShowPdf.aspx` identifier under **“Answer Key”**, establishing official origin. It does not label it final. No claim is made that all 121 PDFs were inspected; the collapsed index records first captures, not a complete publication chronology.

The welcome page separately links a [12 June challenge notification](https://web.archive.org/web/20170708000000id_/http://cbseneet.nic.in/cbseneet/ShowPdf.aspx?Type=E0184ADEDF913B076626646D3F52C3B49C39AD6D&ID=13682AC418603AA0966369D46BBF282F562ACF47), whose first page schedules key challenges for 15–16 June. SHA-256: `9392f9ffb1c73b05c5081c270c41af1cc0c2cc444801a45bbe37180726ca28c0`. The recovered key's later printed date is consistent with a post-challenge publication, but **this is circumstantial evidence, not an explicit final-status authentication**. Neither the recovered key text nor its official link identifies it as final or specifically binds it to the result calculations. The source gate therefore remains closed.

Page 1 visibly bears 30/06/2017. PDF metadata reports creation/modification on 28 June 2017 and generic Word/admin authorship. These observations neither prove nor disprove CBSE origin; they do not establish which key was used for the 23 June result. The 21-page Sarvgyan mirror is a different artifact and was not mixed into the candidate paper/key pair.

## Sources investigated

| Source | Findings and disposition |
| --- | --- |
| [CBSE result press release](https://www.cbse.gov.in/cbsenew/Press_Notes/2017/PRESS%20RELEASE%20-%20NEET%20(UG)%202017%20RESULT.pdf) | Primary authority and challenge-resolution evidence. No final answer table. |
| [CBSE press archive](https://www.cbse.gov.in/cbsenew/press_archive.html) | May/June 2017 conduct/result notices found. No matching final-key publication link located. |
| [CBSE 2017–18 annual report](https://www.cbse.gov.in/cbsenew/annual-report/Annual_Report_2017_18.pdf) | Search-indexed official report located, but opening failed through the research tool; not used to authenticate answers. |
| [Historical CBSE NEET endpoint](https://cbseneet.nic.in/cbseneet/Welcome.aspx) | Unavailable through the research tool; no final-key publication chain recovered. |
| Internet Archive CDX search for `cbseneet.nic.in/*`, 2017 PDF captures | Research-tool access failed; direct public request succeeded with 121 distinct URLs. Five later captures inspected as described above. Official key origin established, final status unresolved. |
| [BYJU'S-hosted C/APRA paper](https://cdn1.byjus.com/neet/wp-content/uploads/2018/03/08072834/neet-code-c-question-paper.pdf) | Downloaded 41-page bilingual reproduction with handwritten marks. Cover and first question page visually inspected; last-page numbering checked. Third-party paper evidence, not an official-hosted original. SHA-256: `a66e7996f14e0d195678cde94503cd5961738157207358f1ec7a3660cbc85041`. |
| [SolveIt archive index](https://solveit.page/resources) and [29-set key mirror](https://solveit.page/resources/pdf/papers/neet/2017/all-29-sets-neet-2017-key-07-05-2017-printed-30-06-2017-5-no-correct-option-answer-key.pdf) | Downloaded; pages 1 and 3 rendered and inspected. Byte-identical to the linked official-domain capture. Official origin established, final status not authenticated. SHA-256: `a96c08d45bfdf913dba697bb71b4e6ae360a1531d29fcc2e8be1256cd3fd895b`. |
| [Sarvgyan key mirror](https://uploads.sarvgyan.com/2017/06/NEET-2017-Answer-Key-min.pdf) | 21-page archive with APRA and code labels; no authenticated official final publication chain located. Not used for answers. |
| [Resonance 2017 key index](https://www.resonance.ac.in/answer-key-solutions/NEET/2017/Answer-Key-Solution.aspx) | Coaching-produced keys and solutions; not official authority. |
| [Aakash APRA A solutions](https://dlp.aakash.ac.in/solutionsneet-2017apracode) | Coaching solution resource; cannot authenticate an official key. |
| [Gujinfo discovery page](https://www.gujinfo.com/20968/neet-2017-answer-key-cutoff.html) | June 2017 challenge-era page links to coaching papers/keys. Its Aakash paper URL returned 403 through the research tool. Not final-key proof. |
| [AglaSem paper index](https://docs.aglasem.com/view/b1bef92a-2d88-11eb-9a94-02f21f5619c4) and [key index](https://docs.aglasem.com/org/nta/neet-ug/answer-key) | Archive candidates; generic NTA attribution for 2017 is inaccurate. No official CBSE final-key chain established. |
| [PYQOnline paper link](https://www.pyqonline.com/exam/neet/papers/neet-question-paper-set-a-2017.pdf) | Access challenge page; paper identity not relied on. |

Searches included official CBSE domains, historical CBSE NEET publication URLs, exact candidate-key title/date, and contemporaneous key-release references. Unsuccessful discovery is not evidence that no official final key exists.

## Validation and scope

- No 2017 dataset, question slots, answer mapping, import payload or quarantine records were added. Source-gate failure is documented here only.
- Regression command: `npm run test -- tests/neet-2018-staging.test.ts tests/neet-2019-staging.test.ts tests/neet-2020-staging.test.ts tests/previous-year-modes.test.ts tests/neet-historical-dataset.test.ts tests/historical-matrix.test.ts`. Also ran `npm run typecheck`, `npm run lint` and `npm run build`; no migration or deployment command ran.
- Temporary PDFs and inspection PNGs are ignored under `tmp/neet-2017/` and are not committed. Hashes and source URLs above identify the inspected candidate artifacts.
- NEET 2018, 2019 and 2020 content, scripts, tests and reports are unchanged from `067e0a73e78a49704a95f08cfa944fe553fa3402`.
- No approved 2021–2025 content, Full Mock 1, attempts/results, scoring, Admissions, Multilingual, database or release configuration changes.
- No production database writes, push, merge, deployment or import. Stop remains at the 2017 source gate.
