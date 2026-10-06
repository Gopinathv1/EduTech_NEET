# JEE Main 2021–2025 V1 coverage checkpoint

```text
TOTAL SHIFTS REVIEWED: 5
TOTAL QUESTIONS REVIEWED: 285
VALIDATED: 218
QUARANTINED: 67

2021:
Reviewed 90
Validated 66
Quarantined 24

2022:
Reviewed 45
Validated 33
Quarantined 12

2023:
Reviewed 60
Validated 46
Quarantined 14

2024:
Reviewed 45
Validated 37
Quarantined 8

2025:
Reviewed 45
Validated 36
Quarantined 9

PHYSICS:
61

CHEMISTRY:
68

MATHEMATICS:
89

MCQ:
136

NUMERICAL_VALUE:
82

CONCEPTUAL_THEORY:
51

NUMERICAL_PROBLEM_SOLVING:
167

TAXONOMY GAPS:
32 quarantined questions across 12 gap categories; no taxonomy writes.
```

| Gap | Questions |
|---|---:|
| Communication Systems | 2 |
| Surface Chemistry | 2 |
| Metallurgy | 3 |
| Environmental Chemistry | 1 |
| Polymers | 2 |
| Solid State | 3 |
| Sets, Relations and Functions | 7 |
| Mathematical Reasoning | 2 |
| Kinematics | 6 |
| Mole Concept / basic chemical calculations | 2 |
| States of Matter / Gas Laws in Chemistry | 1 |
| Mathematical methods / vector algebra in the Physics section | 1 |

Each affected question and reason is recorded in the [taxonomy gap artifact](../data/previous-year/jee/taxonomy-gap-report.json). All 67 exclusions are recorded in the [quarantine artifact](../data/previous-year/jee/quarantine-report.json).

The retained pool populates 50 canonical chapters: Physics 17, Chemistry 19 and Mathematics 14. Every year has all three subjects, both question types and both nature categories. Mathematics has no conceptual/theory questions in this V1; an empty filter must not start an attempt. The mixed pool supports 20 MCQs and 5 numerical-value questions per subject with representation from all five years. Existing 2021 and 2022 coverage is sufficient for useful partial year practice.

Selected shifts are 2021 Session 1 / February 24 / Shift 1; 2022 Session 2 / July 25 / Shift 1; 2023 Session 2 / April 6 / Shift 1; 2024 Session 2 / April 6 / Shift 1; and 2025 Session 1 / January 22 / Shift 1 / Domestic. These are partial verified practices, not complete historical papers. There are 150 unreviewed questions within those selected source papers outside V1; they are not classified as quarantined. Other acquired shifts remain outside V1, and acquisition expansion has stopped.

2023 response-paper image associations could exclude the current stem and include the next stem; nested image names could also collide. Retained wording and options were checked against the original PDF question blocks rather than those defective image associations. 2024's bilingual paper repeated the same question IDs: the reviewed extraction keeps the first English block, excludes the small logo and matches each image by name and dimensions. 2025 response-paper image boundaries were corrected against the original source so the current stem and its options stay together. Corrected 2024/2025 review-image hashes match the files used for review.

All 218 retained questions map exactly to their applicable NTA final-key question IDs. MCQs use the source's actual displayed option order; numerical answers remain numerical. All 82 retained numerical answers are integers and are compatible with the existing JEE integer-response route. Source-paper and selected final-key PDF hashes match persisted provenance. The approved 2022 exception preserves `originalQuestionNumber: null`, uses the exact NTA question ID as canonical identity and records source order separately.

No production write is authorized by this checkpoint. NEET and both existing Full Mocks remain protected. Temporary source and review files remain in `tmp/` and must not be committed.
