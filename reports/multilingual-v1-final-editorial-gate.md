# Multilingual V1 final editorial gate

**PRE-APPROVAL — repository artifacts only. STOP before production approval.**

Prepared 7 October 2026 at 15:49:41 GMT+5:30. Editorial authority: [completed terminology review](multilingual-v1-terminology-review.md), accepted by the user for this proof set. Review file SHA256 (bytes): `dd82f038e9d4737bc903116b4a8dd90b80481ecd1277d618a4b5e0ae678c904b`.

**Translations changed: 8. Tamil changed: 5. Hindi changed: 3. Unchanged: 12. READY_TO_APPROVE: 20. NEEDS_CORRECTION: 0.**

These final results describe the corrected local proof wording. Production retains the previously deployed wording and REVIEW_REQUIRED state: this task does not connect to production, edit rows, or attest to a fresh live database snapshot. All 20 local manifest records also remain REVIEW_REQUIRED. READY_TO_APPROVE is an editorial recommendation, not an approval state or write authorization.

Deployed baseline release SHA256: `0ec36c13423b0b234a4d8bd0a91e7e0388ed8ff83bc7be7d93ab75a69a277898`. Revised local proof release SHA256: `92ce13d6155e1c3fe1cd7acc89170940b785193ff8ba719fdedd4ed9d7f9b33f`. Eight draft wording SHA256: `404ef00042b655e5137b2f6088c493fdbd59a7ffecfba252250427d2fee44cdc`. The revised hash describes a local pre-approval candidate; historical production release reports retain their original hashes.

## Focused QA

| Check | Result | Evidence / scope |
| --- | --- | --- |
| Number preservation | PASS 20/20 | Per-field decimal, superscript and subscript multisets compared with canonical English and original proof. |
| Formula / variable / chemical-formula preservation | PASS 20/20 | Repository translationQa token checks, exact scientific spans, three complete linear equations, mathematical option strings and ordered chemical-pair labels. |
| Unit preservation | PASS 20/20 | Unit symbols and quantity–unit bindings compared per field; no quantity is rebound. |
| Option count | PASS 20/20 | 14 MCQ translations have four slots; six numerical translations have zero slots. Statement compound labels are not answer options. |
| Option identity/order | PASS 20/20 | All slots identical except the authorized Tamil ecology B lexical correction; that option remains the Retardation factor distractor in B. |
| Numerical-answer binding | PASS 6/6; N/A 14 | Canonical-content hashes include answer/tolerance; no translated answer field is introduced. Full canonical record hashes also match the deployed proof. |
| Semantic equivalence | PASS 20/20 against authoritative review | Eight replacements exactly match the reviewed full drafts and allowed phrase edits; twelve others match the previously READY wording. Carries forward that editorial decision, without claiming automated semantic proof or new independent human sign-off. |
| Focused repository unit tests | PASS 44/44 | Three multilingual test files only; semantic-attestation guard, token corruption, canonical binding, option permutation, and student payload boundaries are covered with mocked data. |

The repository has no automatic full-language semantic-equivalence oracle. Its workflow requires meaningAndOptionIdentityChecked for approval; focused mocked tests verify this guard. Authoritative editorial acceptance and exact draft matching supply the meaning decision for this task. Formula/unit checks pass vacuously where no applicable span exists.

Focused commands: `npx tsx scripts/validate-translation-proof.ts`; `npx vitest run tests/question-translations.test.ts tests/question-translation-workflow.test.ts tests/question-translation-payload.test.ts`. Additional offline report checks compared the candidate to Git HEAD and parsed the authoritative report directly; the temporary helper and test JSON were removed after verification. No full-site sanity audit, browser suite, build, deployment or database dry-run was performed.

## Exact final disposition

| Proof question | Canonical historical identity | Question ID | Translation ID | Language | Previous editorial state | Wording changed | Structural QA | Editorial result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `historical-verified:neet:2021:m4:3` | `cmumlu0g90001o6lc3yl96p6f` | `qt-v1-646c58c553d33fcca20325e5f7d0d7b2` | Tamil | NEEDS_CORRECTION | YES | PASS | **READY_TO_APPROVE** |
| 1 | `historical-verified:neet:2021:m4:3` | `cmumlu0g90001o6lc3yl96p6f` | `qt-v1-b1ea1c949179cb1a41aef09b64113f27` | Hindi | READY_TO_APPROVE | NO | PASS | **READY_TO_APPROVE** |
| 2 | `historical-verified:neet:2021:m4:15` | `cmumlu1bo000bo6lceckqz28w` | `qt-v1-e43070091bfce66b095e289485ed4186` | Tamil | NEEDS_CORRECTION | YES | PASS | **READY_TO_APPROVE** |
| 2 | `historical-verified:neet:2021:m4:15` | `cmumlu1bo000bo6lceckqz28w` | `qt-v1-fcd93e7c9f16267785d43385db861f75` | Hindi | READY_TO_APPROVE | NO | PASS | **READY_TO_APPROVE** |
| 3 | `historical-verified:neet:2021:m4:52` | `cmumlu4k00024o6lc5pn89xy6` | `qt-v1-cf9fc1cbebda5ff75bc0d883192cb23e` | Tamil | NEEDS_CORRECTION | YES | PASS | **READY_TO_APPROVE** |
| 3 | `historical-verified:neet:2021:m4:52` | `cmumlu4k00024o6lc5pn89xy6` | `qt-v1-040b0700fde35355916e66981dcdd472` | Hindi | NEEDS_CORRECTION | YES | PASS | **READY_TO_APPROVE** |
| 4 | `historical-verified:neet:2021:m4:101` | `cmumluaux005no6lcmyvfv1rl` | `qt-v1-3b5b00c8b0b4763785a0704bf7e42813` | Tamil | NEEDS_CORRECTION | YES | PASS | **READY_TO_APPROVE** |
| 4 | `historical-verified:neet:2021:m4:101` | `cmumluaux005no6lcmyvfv1rl` | `qt-v1-c0a32d561bac3b498692a5101c571ccf` | Hindi | READY_TO_APPROVE | NO | PASS | **READY_TO_APPROVE** |
| 5 | `historical-verified:neet:2021:m4:151` | `cmumlum0b00bvo6lchsmy2rse` | `qt-v1-2f33efe7d1ffc7298adace5c114741f4` | Tamil | READY_TO_APPROVE | NO | PASS | **READY_TO_APPROVE** |
| 5 | `historical-verified:neet:2021:m4:151` | `cmumlum0b00bvo6lchsmy2rse` | `qt-v1-e08e8eb3d7a0405bb9530987d939185e` | Hindi | NEEDS_CORRECTION | YES | PASS | **READY_TO_APPROVE** |
| 6 | `jee-main-2021-s1-2021-02-24-shift-1-q29-nta-70819115182` | `cmuwt6e9x003co69s06p8mked` | `qt-v1-2ad7ed70a5ba2d8be27f17e5bfdfb75a` | Tamil | NEEDS_CORRECTION | YES | PASS | **READY_TO_APPROVE** |
| 6 | `jee-main-2021-s1-2021-02-24-shift-1-q29-nta-70819115182` | `cmuwt6e9x003co69s06p8mked` | `qt-v1-247b1c8c5203aa14a0d597c72f624fc4` | Hindi | NEEDS_CORRECTION | YES | PASS | **READY_TO_APPROVE** |
| 7 | `jee-main-2021-s1-2021-02-24-shift-1-q63-nta-70819115216` | `cmuwt6vkn0070o69se3143bhu` | `qt-v1-6f2d41dba057a03bec86d736eb74fbaf` | Tamil | READY_TO_APPROVE | NO | PASS | **READY_TO_APPROVE** |
| 7 | `jee-main-2021-s1-2021-02-24-shift-1-q63-nta-70819115216` | `cmuwt6vkn0070o69se3143bhu` | `qt-v1-6e7b77cec506e2460a674a79b82a6531` | Hindi | READY_TO_APPROVE | NO | PASS | **READY_TO_APPROVE** |
| 8 | `jee-main-2021-s1-2021-02-24-shift-1-q86-nta-70819115239` | `cmuwt7acl00a6o69sqpvyjuc9` | `qt-v1-d981b2bbf3551989c3056509f61eaeab` | Tamil | READY_TO_APPROVE | NO | PASS | **READY_TO_APPROVE** |
| 8 | `jee-main-2021-s1-2021-02-24-shift-1-q86-nta-70819115239` | `cmuwt7acl00a6o69sqpvyjuc9` | `qt-v1-fc6628984bf1bc107a17f8592e04b964` | Hindi | READY_TO_APPROVE | NO | PASS | **READY_TO_APPROVE** |
| 9 | `jee-main-2021-s1-2021-02-24-shift-1-q31-nta-70819115184` | `cmuwt6fuu003oo69sv0yfaqfo` | `qt-v1-eead2c2dd706a882c3d3d4db97ad9c4e` | Tamil | READY_TO_APPROVE | NO | PASS | **READY_TO_APPROVE** |
| 9 | `jee-main-2021-s1-2021-02-24-shift-1-q31-nta-70819115184` | `cmuwt6fuu003oo69sv0yfaqfo` | `qt-v1-416e3670196399bc59ec43bd7d8cf45e` | Hindi | READY_TO_APPROVE | NO | PASS | **READY_TO_APPROVE** |
| 10 | `jee-main-2021-s1-2021-02-24-shift-1-q59-nta-70819115212` | `cmuwt6u2m006oo69s4l58smwq` | `qt-v1-541380c5e35d3dc31b9733c15848fde6` | Tamil | READY_TO_APPROVE | NO | PASS | **READY_TO_APPROVE** |
| 10 | `jee-main-2021-s1-2021-02-24-shift-1-q59-nta-70819115212` | `cmuwt6u2m006oo69s4l58smwq` | `qt-v1-5ee9194425a6b79e6c65700202191964` | Hindi | READY_TO_APPROVE | NO | PASS | **READY_TO_APPROVE** |

## Final wording for all 20 translations

These are the exact repository strings. No correct answer, numerical value/tolerance, explanation or identifying hint is copied into the student-facing translation text.

### Question 1 — Tamil

Historical identity: `historical-verified:neet:2021:m4:3`. Question ID: `cmumlu0g90001o6lc3yl96p6f`. Translation ID: `qt-v1-646c58c553d33fcca20325e5f7d0d7b2`.

Previous editorial state: **NEEDS_CORRECTION**. Wording changed: **YES**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
ஒரு பொருள் ‘n’ அதிர்வெண்ணுடன் தனிச்சீரிசை இயக்கத்தில் இயங்குகிறது. அதன் நிலை ஆற்றலின் அதிர்வெண்:
```

**Final options in canonical order**

| Slot | Text |
| --- | --- |
| A | n |
| B | 2n |
| C | 3n |
| D | 4n |

### Question 1 — Hindi

Historical identity: `historical-verified:neet:2021:m4:3`. Question ID: `cmumlu0g90001o6lc3yl96p6f`. Translation ID: `qt-v1-b1ea1c949179cb1a41aef09b64113f27`.

Previous editorial state: **READY_TO_APPROVE**. Wording changed: **NO**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
एक पिंड ‘n’ आवृत्ति से सरल आवर्त गति कर रहा है। उसकी स्थितिज ऊर्जा की आवृत्ति है:
```

**Final options in canonical order**

| Slot | Text |
| --- | --- |
| A | n |
| B | 2n |
| C | 3n |
| D | 4n |

### Question 2 — Tamil

Historical identity: `historical-verified:neet:2021:m4:15`. Question ID: `cmumlu1bo000bo6lceckqz28w`. Translation ID: `qt-v1-e43070091bfce66b095e289485ed4186`.

Previous editorial state: **NEEDS_CORRECTION**. Wording changed: **YES**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
10 N விசையால் ஒரு சுருள் வில் 5 cm நீட்டப்படுகிறது. அதில் 2 kg நிறையுள்ள பொருளைத் தொங்கவிடும்போது அதன் அலைவுக்காலம்:
```

**Final options in canonical order**

| Slot | Text |
| --- | --- |
| A | 0.0628 s |
| B | 6.28 s |
| C | 3.14 s |
| D | 0.628 s |

### Question 2 — Hindi

Historical identity: `historical-verified:neet:2021:m4:15`. Question ID: `cmumlu1bo000bo6lceckqz28w`. Translation ID: `qt-v1-fcd93e7c9f16267785d43385db861f75`.

Previous editorial state: **READY_TO_APPROVE**. Wording changed: **NO**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
10 N बल से एक स्प्रिंग 5 cm खिंचती है। जब उससे 2 kg द्रव्यमान लटकाया जाता है, तो दोलनों का आवर्तकाल है:
```

**Final options in canonical order**

| Slot | Text |
| --- | --- |
| A | 0.0628 s |
| B | 6.28 s |
| C | 3.14 s |
| D | 0.628 s |

### Question 3 — Tamil

Historical identity: `historical-verified:neet:2021:m4:52`. Question ID: `cmumlu4k00024o6lc5pn89xy6`. Translation ID: `qt-v1-cf9fc1cbebda5ff75bc0d883192cb23e`.

Previous editorial state: **NEEDS_CORRECTION**. Wording changed: **YES**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
Bravais படிக அணிக்கோவையின் 14 வகை அலகுக் கூடுகளிலும், பொருள் மைய அலகுக் கூடுகளின் எண்ணிக்கைக்கான சரியான விடை:
```

**Final options in canonical order**

| Slot | Text |
| --- | --- |
| A | 7 |
| B | 5 |
| C | 2 |
| D | 3 |

### Question 3 — Hindi

Historical identity: `historical-verified:neet:2021:m4:52`. Question ID: `cmumlu4k00024o6lc5pn89xy6`. Translation ID: `qt-v1-040b0700fde35355916e66981dcdd472`.

Previous editorial state: **NEEDS_CORRECTION**. Wording changed: **YES**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
Bravais जालक की सभी 14 प्रकार की एकक कोष्ठिकाओं में अंतःकेंद्रित एकक कोष्ठिकाओं की संख्या का सही विकल्प है:
```

**Final options in canonical order**

| Slot | Text |
| --- | --- |
| A | 7 |
| B | 5 |
| C | 2 |
| D | 3 |

### Question 4 — Tamil

Historical identity: `historical-verified:neet:2021:m4:101`. Question ID: `cmumluaux005no6lcmyvfv1rl`. Translation ID: `qt-v1-3b5b00c8b0b4763785a0704bf7e42813`.

Previous editorial state: **NEEDS_CORRECTION**. Wording changed: **YES**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
GPP − R = NPP என்ற சமன்பாட்டில் R குறிப்பது:
```

**Final options in canonical order**

| Slot | Text |
| --- | --- |
| A | கதிர்வீச்சு ஆற்றல் |
| B | ஒடுக்கக் காரணி |
| C | சுற்றுச்சூழல் காரணி |
| D | சுவாச இழப்புகள் |

### Question 4 — Hindi

Historical identity: `historical-verified:neet:2021:m4:101`. Question ID: `cmumluaux005no6lcmyvfv1rl`. Translation ID: `qt-v1-c0a32d561bac3b498692a5101c571ccf`.

Previous editorial state: **READY_TO_APPROVE**. Wording changed: **NO**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
GPP − R = NPP समीकरण में R दर्शाता है:
```

**Final options in canonical order**

| Slot | Text |
| --- | --- |
| A | विकिरण ऊर्जा |
| B | मंदन गुणक |
| C | पर्यावरण गुणक |
| D | श्वसन हानियाँ |

### Question 5 — Tamil

Historical identity: `historical-verified:neet:2021:m4:151`. Question ID: `cmumlum0b00bvo6lchsmy2rse`. Translation ID: `qt-v1-2f33efe7d1ffc7298adace5c114741f4`.

Previous editorial state: **READY_TO_APPROVE**. Wording changed: **NO**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
பின்வரும் உயிரினங்களில் எது உள்ளீடற்ற, காற்றறைகளைக் கொண்ட நீண்ட எலும்புகளை உடையது?
```

**Final options in canonical order**

| Slot | Text |
| --- | --- |
| A | Neophron |
| B | Hemidactylus |
| C | Macropus |
| D | Ornithorhynchus |

### Question 5 — Hindi

Historical identity: `historical-verified:neet:2021:m4:151`. Question ID: `cmumlum0b00bvo6lchsmy2rse`. Translation ID: `qt-v1-e08e8eb3d7a0405bb9530987d939185e`.

Previous editorial state: **NEEDS_CORRECTION**. Wording changed: **YES**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
निम्नलिखित में से किस जीव में खोखली और वायुकोष युक्त लंबी हड्डियाँ होती हैं?
```

**Final options in canonical order**

| Slot | Text |
| --- | --- |
| A | Neophron |
| B | Hemidactylus |
| C | Macropus |
| D | Ornithorhynchus |

### Question 6 — Tamil

Historical identity: `jee-main-2021-s1-2021-02-24-shift-1-q29-nta-70819115182`. Question ID: `cmuwt6e9x003co69s06p8mked`. Translation ID: `qt-v1-2ad7ed70a5ba2d8be27f17e5bfdfb75a`.

Previous editorial state: **NEEDS_CORRECTION**. Wording changed: **YES**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
5 GHz அதிர்வெண் கொண்ட மின்காந்த அலை, சார்பு மின் விடுதிறன் மற்றும் சார்பு காந்த உட்புகுதிறன் இரண்டும் 2 ஆக உள்ள ஓர் ஊடகத்தில் பயணிக்கிறது. இந்த ஊடகத்தில் அதன் திசைவேகம் ______ × 10⁷ m/s.
```

Options: **N/A — zero answer options**.

### Question 6 — Hindi

Historical identity: `jee-main-2021-s1-2021-02-24-shift-1-q29-nta-70819115182`. Question ID: `cmuwt6e9x003co69s06p8mked`. Translation ID: `qt-v1-247b1c8c5203aa14a0d597c72f624fc4`.

Previous editorial state: **NEEDS_CORRECTION**. Wording changed: **YES**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
5 GHz आवृत्ति की एक विद्युतचुंबकीय तरंग ऐसे माध्यम में चल रही है जिसकी आपेक्षिक विद्युतशीलता और आपेक्षिक चुंबकशीलता दोनों 2 हैं। इस माध्यम में उसका वेग ______ × 10⁷ m/s है।
```

Options: **N/A — zero answer options**.

### Question 7 — Tamil

Historical identity: `jee-main-2021-s1-2021-02-24-shift-1-q63-nta-70819115216`. Question ID: `cmuwt6vkn0070o69se3143bhu`. Translation ID: `qt-v1-6f2d41dba057a03bec86d736eb74fbaf`.

Previous editorial state: **READY_TO_APPROVE**. Wording changed: **NO**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
பின்வரும் நேரியல் சமன்பாடுகளின் தொகுப்பு
3x − 2y − kz = 10
2x − 4y − 2z = 6
x + 2y − z = 5m
எந்த நிலையில் முரண்பாடானது?
```

**Final options in canonical order**

| Slot | Text |
| --- | --- |
| A | k ≠ 3, m ≠ 4/5 |
| B | k = 3, m = 4/5 |
| C | k = 3, m ≠ 4/5 |
| D | k ≠ 3, m ∈ ℝ |

### Question 7 — Hindi

Historical identity: `jee-main-2021-s1-2021-02-24-shift-1-q63-nta-70819115216`. Question ID: `cmuwt6vkn0070o69se3143bhu`. Translation ID: `qt-v1-6e7b77cec506e2460a674a79b82a6531`.

Previous editorial state: **READY_TO_APPROVE**. Wording changed: **NO**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
रैखिक समीकरणों का निकाय
3x − 2y − kz = 10
2x − 4y − 2z = 6
x + 2y − z = 5m
कब असंगत है?
```

**Final options in canonical order**

| Slot | Text |
| --- | --- |
| A | k ≠ 3, m ≠ 4/5 |
| B | k = 3, m = 4/5 |
| C | k = 3, m ≠ 4/5 |
| D | k ≠ 3, m ∈ ℝ |

### Question 8 — Tamil

Historical identity: `jee-main-2021-s1-2021-02-24-shift-1-q86-nta-70819115239`. Question ID: `cmuwt7acl00a6o69sqpvyjuc9`. Translation ID: `qt-v1-d981b2bbf3551989c3056509f61eaeab`.

Previous editorial state: **READY_TO_APPROVE**. Wording changed: **NO**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
4/(sin x) + 1/(1 − sin x) = α என்ற சமன்பாட்டிற்கு (0, π/2) இடைவெளியில் குறைந்தது ஒரு தீர்வு இருக்குமாறு அமையும் α இன் குறைந்தபட்ச மதிப்பு ______.
```

Options: **N/A — zero answer options**.

### Question 8 — Hindi

Historical identity: `jee-main-2021-s1-2021-02-24-shift-1-q86-nta-70819115239`. Question ID: `cmuwt7acl00a6o69sqpvyjuc9`. Translation ID: `qt-v1-fc6628984bf1bc107a17f8592e04b964`.

Previous editorial state: **READY_TO_APPROVE**. Wording changed: **NO**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
α का वह न्यूनतम मान, जिसके लिए समीकरण 4/(sin x) + 1/(1 − sin x) = α का (0, π/2) में कम से कम एक हल है, ______ है।
```

Options: **N/A — zero answer options**.

### Question 9 — Tamil

Historical identity: `jee-main-2021-s1-2021-02-24-shift-1-q31-nta-70819115184`. Question ID: `cmuwt6fuu003oo69sv0yfaqfo`. Translation ID: `qt-v1-eead2c2dd706a882c3d3d4db97ad9c4e`.

Previous editorial state: **READY_TO_APPROVE**. Wording changed: **NO**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
பின்வருவனவற்றில் ஒரே கட்டமைப்பைக் கொண்ட இணைகள் எவை?
A. SO₄²⁻ மற்றும் CrO₄²⁻
B. SiCl₄ மற்றும் TiCl₄
C. NH₃ மற்றும் NO₃⁻
D. BCl₃ மற்றும் BrCl₃
```

**Final options in canonical order**

| Slot | Text |
| --- | --- |
| A | A மற்றும் B மட்டும் |
| B | A மற்றும் C மட்டும் |
| C | B மற்றும் C மட்டும் |
| D | C மற்றும் D மட்டும் |

### Question 9 — Hindi

Historical identity: `jee-main-2021-s1-2021-02-24-shift-1-q31-nta-70819115184`. Question ID: `cmuwt6fuu003oo69sv0yfaqfo`. Translation ID: `qt-v1-416e3670196399bc59ec43bd7d8cf45e`.

Previous editorial state: **READY_TO_APPROVE**. Wording changed: **NO**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
निम्नलिखित में से कौन-से समसंरचनात्मक युग्म हैं?
A. SO₄²⁻ और CrO₄²⁻
B. SiCl₄ और TiCl₄
C. NH₃ और NO₃⁻
D. BCl₃ और BrCl₃
```

**Final options in canonical order**

| Slot | Text |
| --- | --- |
| A | केवल A और B |
| B | केवल A और C |
| C | केवल B और C |
| D | केवल C और D |

### Question 10 — Tamil

Historical identity: `jee-main-2021-s1-2021-02-24-shift-1-q59-nta-70819115212`. Question ID: `cmuwt6u2m006oo69s4l58smwq`. Translation ID: `qt-v1-541380c5e35d3dc31b9733c15848fde6`.

Previous editorial state: **READY_TO_APPROVE**. Wording changed: **NO**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
பின்வருவனவற்றில் ஈரியல்புச் சேர்மங்களின் எண்ணிக்கை ______.
(A) BeO (B) BaO (C) Be(OH)₂ (D) Sr(OH)₂
```

Options: **N/A — zero answer options**.

### Question 10 — Hindi

Historical identity: `jee-main-2021-s1-2021-02-24-shift-1-q59-nta-70819115212`. Question ID: `cmuwt6u2m006oo69s4l58smwq`. Translation ID: `qt-v1-5ee9194425a6b79e6c65700202191964`.

Previous editorial state: **READY_TO_APPROVE**. Wording changed: **NO**. Structural QA: **PASS**. Editorial result: **READY_TO_APPROVE**. Local/production review state: **REVIEW_REQUIRED** (production unchanged; not queried in this task).

**Final question text**

```text
निम्नलिखित में उभयधर्मी यौगिकों की संख्या ______ है।
(A) BeO (B) BaO (C) Be(OH)₂ (D) Sr(OH)₂
```

Options: **N/A — zero answer options**.

## Preservation evidence and stop point

Only eight content records differ from the deployed proof. All twelve other manifest records are deeply identical, including QA metadata. Every other manifest field is identical except the aggregate release checksum. Ten canonical full-record SHA256 values and answer-bound canonical hashes remain identical; this protects English wording, identity, dates/session/shift, subject/chapter, type/nature, provenance and answers/tolerance. No canonical file was edited.

| Canonical source file | SHA256 after checks |
| --- | --- |
| `data/previous-year/neet/2021/questions.json` | `31e3d61172158da516371632012a7e5836895796218a10dbc8a952566436bb15` |
| `data/previous-year/jee/2021/questions.json` | `4b22fa9face3b136cbe9c519dbecb28c945e045e1c961fd8ef6299a46b1965de` |
| `data/previous-year/neet/question-nature.json` | `cebe862edfecf15f36b915ae0737bdb59155ea017fd97528aa470e4724e99607` |

Files changed/created in this task: `data/question-translations-v1/proof-wording.json`, `data/question-translations-v1/proof-manifest.json`, and `reports/multilingual-v1-final-editorial-gate.md`. The input terminology review was already present and was not modified.

Temporary .next terminology/report-generation artifacts remaining: **NO** after targeted cleanup; unrelated existing build/deployment artifacts are retained. No generated .next file is staged or committed.

**Production writes: 0. Approvals: 0. Deployments: 0. Migrations: 0. Canonical English edits: 0. Pushes: 0. Merges: 0.** No commit was created. Stop here before any production correction or approval.
