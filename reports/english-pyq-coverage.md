# English PYQ 2013–2020 audit checkpoint

Branch: `codex/english-pyq-2013-2020`. Base: `88ac52cc07d2b8bc96671ec76fdad6dd0b131513`. This is an incomplete audit checkpoint, not a content release.

## Existing 2021–2025

Expected refers to the selected source paper only. Every row is PARTIAL; no annual completeness claim is supported. Stored means repository records, not database records. Approval and student visibility in the database remain unknown.

| Exam | Year | Expected selected | Stored / validated | Explicit file approval | Quarantine | Unrepresented | Missing usable | Duplicate IDs / exact content |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| NEET | 2021 | 200 | 113 / 113 | 0 | 87 | 0 | 87 | 0 / 0 |
| NEET | 2022 | 200 | 157 / 157 | 0 | 43 | 0 | 43 | 0 / 0 |
| NEET | 2023 | 200 | 172 / 172 | 0 | 28 | 0 | 28 | 0 / 0 |
| NEET | 2024 | 200 | 171 / 171 | 0 | 29 | 0 | 29 | 0 / 0 |
| NEET | 2025 | 180 | 167 / 167 | 0 | 13 | 0 | 13 | 0 / 0 |
| JEE | 2021 | 90 | 66 / 66 | 0 | 24 | 0 | 24 | 0 / 0 |
| JEE | 2022 | 90 | 33 / 33 | 0 | 12 | 45 | 57 | 0 / 0 |
| JEE | 2023 | 90 | 46 / 46 | 0 | 14 | 30 | 44 | 0 / 0 |
| JEE | 2024 | 90 | 37 / 37 | 0 | 8 | 45 | 53 | 0 / 0 |
| JEE | 2025 | 75 | 36 / 36 | 0 | 9 | 30 | 39 | 0 / 0 |

## 2013–2020

| Exam identity | Year | Expected per paper | Stored | Approved | Quarantine | Missing per paper |
|---|---:|---:|---:|---:|---:|---:|
| NEET (UG) 2013 | 2013 | 180 | 0 | 0 | 0 | 180 |
| AIPMT 2014 | 2014 | 180 | 0 | 0 | 0 | 180 |
| AIPMT 2015 Re-test | 2015 | 180 | 0 | 0 | 0 | 180 |
| AIPMT/NEET-I and NEET-II 2016 | 2016 | 180 | 0 | 0 | 0 | 180 |
| NEET (UG) 2017 | 2017 | 180 | 0 | 0 | 0 | 180 |
| NEET (UG) 2018 | 2018 | 180 | 0 | 0 | 0 | 180 |
| NEET (UG) 2019 | 2019 | 180 | 0 | 0 | 0 | 180 |
| NEET (UG) 2020 | 2020 | 180 | 0 | 0 | 0 | 180 |
| JEE (Main) 2013 Paper 1 | 2013 | 90 | 0 | 0 | 0 | 90 |
| JEE (Main) 2014 Paper 1 | 2014 | 90 | 0 | 0 | 0 | 90 |
| JEE (Main) 2015 Paper 1 | 2015 | 90 | 0 | 0 | 0 | 90 |
| JEE (Main) 2016 Paper 1 | 2016 | 90 | 0 | 0 | 0 | 90 |
| JEE (Main) 2017 Paper 1 | 2017 | 90 | 0 | 0 | 0 | 90 |
| JEE (Main) 2018 Paper 1 | 2018 | 90 | 0 | 0 | 0 | 90 |
| JEE (Main) 2019 Paper 1 | 2019 | 90 | 0 | 0 | 0 | 90 |
| JEE (Main) 2020 Paper 1 | 2020 | 75 | 0 | 0 | 0 | 75 |

The historical expected counts come from the existing examination matrix and have not all been independently reverified. Per-paper counts must not be summed as annual totals. NEET 2016 has two legitimate phases; 2015 cancelled AIPMT and the re-test must remain separate. Booklet permutations need content-level deduplication. JEE requires actual date, shift, session, subject and question type; 2020 has numerical questions and cannot be treated as the pre-2020 all-MCQ pattern.

## Source investigation

- [CBSE AIPMT 2014 official key](https://www.cbse.gov.in/attach/aipmtkey2014.pdf): accessed; 180 rows and P/Q/R/S columns. Raw value 9 occurs and must not be converted to an option without official semantics.
- [AIPMT 2014 publisher archive](https://www.resonance.ac.in/answer-key-solutions/AIPMT/2014/Answer-Key-Solution.aspx): paper candidates separated from coaching keys/solutions. [Code P PDF](https://www.resonance.ac.in/answer-key-solutions/AIPMT/2014/Solutions/Code-P-English-Hindi.pdf) opens as a 40-page image PDF without extracted text. Not approved for ingestion.
- [NTA NEET 2019 final key](https://www.nta.ac.in/Download/Notice/20190605125750.pdf): official key located; exact wording/booklet pair still required.
- [NTA NEET archive](https://neet.nta.nic.in/archive/): English 2020 E1–E6/F/G/H paper entries located. One bilingual PDF retrieval returned an internal error; this does not prove all English PDFs unavailable.
- [JEE official archive](https://jeemain.nta.nic.in/document-category/archive/page/10/): 2020 bulletin entry located; complete paper/session census and exact final-key mappings remain pending.

## Remaining blockers and release gate

No new question is verified, approved, imported or activated. Missing source material is not labelled question quarantine. AIPMT 2014 needs image transcription and visual review against the official key; other years need exact paper/key acquisition, hashes, complete session inventory and review. Current database coverage needs a separately supplied read-only export or audited read-only access; no database was contacted. New content must pass the existing approval/quarantine process. Existing hard-coded 2021–2025 import/approval selections must not be broadened blindly.

Full Mocks, canonical approved questions, attempts/results, scoring, multilingual and Admissions files are untouched. Rendering, mobile/desktop, filters and practice validation for new content remain pending because no new content is ready. Stop before push, merge and production import.
