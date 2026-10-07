# Multilingual V1 terminology review

**Review proposal only — no production edits or approvals.**

Production baseline checked read-only: **7 October 2026 at 15:17:42 GMT+5:30**. All 20 rows still have review state **REVIEW_REQUIRED**, revision 1, source **SIVORA_TRANSLATION**.

Scope: the same 10 proof questions (5 NEET / 5 JEE), 10 Tamil and 10 Hindi translations. Proof release SHA256: `0ec36c13423b0b234a4d8bd0a91e7e0388ed8ff83bc7be7d93ab75a69a277898`. Selected production baseline SHA256: `6d5eb744bfd4a6bcec054b1550c5204eb8900726349ee00d9e8acb0a7adc481a`. Proposed wording SHA256 (eight changed records, ordered as below): `404ef00042b655e5137b2f6088c493fdbd59a7ffecfba252250427d2fee44cdc`.

**Current wording outcome: READY_TO_APPROVE 12; NEEDS_CORRECTION 8 (Tamil 5 / Hindi 3).** These are editorial recommendations, not database states. READY_TO_APPROVE means no correction is recommended by this terminology/semantic desk review; it does not authorize approval or claim that a new independent human review occurred. NEEDS_CORRECTION refers to the current production wording even when its proposed replacement passes QA.

Canonical English, numbers, formulae, units, variables, option positions, answer identity, numerical answers and tolerances are unchanged. Revised wording appears only in this report. No proof dataset, source manifest, runtime file or previous review document was edited.

## Reference policy and evidence

References are used for short technical terms and their meanings only. No complete third-party/coaching question, answer or solution is reproduced. Replacement sentences below are minimal edits of SIVORA's existing proof wording. A source's availability does not imply a licence to republish its questions.

Tamil school terminology takes precedence over a generic dictionary synonym where the textbook supplies the exact subject term. Hindi recommendations use NCERT or the Government of India's Commission for Scientific and Technical Terminology (CSTT). Valid descriptive equivalents and established synonyms are kept; this is not a wholesale literal retranslation. English proper names such as Bravais and the four Latin organism names are retained.

The Tamil school references below are **Government of Tamil Nadu / SCERT primary textbooks inspected directly**, accessed through publicly available mirrored PDF copies. Their third-party host is not the terminology authority. The relevant pages were rendered to verify spellings because text extraction damaged Tamil glyphs. The official school-textbook portal could not be fetched in this run; the government glossary was also read directly. No claim is made that these historical reference editions establish the entire current exam syllabus.

| Ref | Authority / document | Exact location used and evidence |
| --- | --- | --- |
| T1 | [Tamil Nadu SCERT, Class XI Physics, Volume II, Tamil textbook](https://drive.google.com/file/d/1Ext1dMSTiWmeU3tdltVxaV5O7AYYpHXW/view) | Printed p. 325 / PDF p. 333, glossary entries 95 and 98: தனிச்சீரிசை இயக்கம் and அலைவுக்காலம். The English entry 95 has a spelling error, “Hormonic”; the Tamil term and oscillation context identify SHM. |
| T2 | [Tamil Nadu SCERT, Class XII Physics, Volume I, Tamil textbook](https://drive.google.com/file/d/1xTDyhRJ1TS7nFa5DWzz6QLuUvWQiN76o/view) | Printed p. 5 / PDF p. 13 explicitly identifies சார்பு விடுதிறன் with relative permittivity. Printed p. 333 / PDF p. 341, glossary entries 84 and 88 give விடுதிறன் and சார்பு உட்புகுதிறன். The proposed question retains மின் / காந்த as subject qualifiers. |
| T3 | [Tamil Nadu SCERT, Class XII Chemistry, Volume I, Tamil textbook](https://drive.google.com/file/d/1Y9erpGPEd5Vu4xXFYM5NCHveW-dOP_LY/view) | Printed p. 309 / PDF p. 319, glossary: பொருள் மைய is the body-centred component, அலகுக்கூடு is unit cell, and ஈரியல்புத் தன்மை is used for amphoteric character. The body-centred example is cubic; the proposal deliberately does not import that restriction into the English question. |
| T4 | [Tamil Virtual Academy, technical glossary](https://www.tamilvu.org/library/technical_glossary/html/index.htm) | Direct public English-term lookups were retrieved. Relevant subject entries support the valid terms and the compositional distractor recommendation listed below. The glossary has multiple subject-dependent alternatives; a dictionary entry is not automatically a school-context replacement. |
| H1 | [NCERT Hindi, Class XI Physics exemplar, Oscillations](https://ncert.nic.in/pdf/publication/exemplarproblem/classXI/physics%28hindi%29/khep314.pdf), with [NCERT Oscillations text hosted by IIT Kanpur SATHEE](https://sathee.iitk.ac.in/hi/sathee-jee/ncert-books/jee-ncert-books/jee-nb-phy-11/phy-11-chapter-13-oscillations/) | NCERT exemplar uses सरल आवर्त गति; the chapter terminology supports स्थितिज ऊर्जा, स्प्रिंग and आवर्तकाल. Only these short terms are used, not source questions or worked examples. |
| H2 | [NCERT Hindi, Class XII Chemistry exemplar, Solid State](https://ncert.nic.in/pdf/publication/exemplarproblem/classXII/chemistry%28hindi%29/lhep401.pdf) | Printed / PDF p. 12 uses एकक कोष्ठिका and अंतः केंद्रित; the page was visually checked. Supports replacing generic इकाई कोशिका with the crystallographic term, while keeping the existing अंतःकेंद्रित component. |
| H3 | [NCERT Hindi Animal Kingdom text, IIT Kanpur SATHEE](https://sathee.iitk.ac.in/hi/ncert-books/ncert-books-theory/nbt-bio-11/bio-11-chapter-4-animal-kingdom/) | Aves section distinguishes खोखली from वायुकोष युक्त in the description of long bones. Hindi हड्डियाँ is a valid common equivalent of अस्थियाँ and is not changed merely for stylistic uniformity. |
| H4 | [NCERT Hindi Electromagnetic Waves text, IIT Kanpur SATHEE](https://sathee.iitk.ac.in/hi/ncert-books/ncert-books-theory/nbt-phy-12/phy-12-chapter-8-electromagnetic-waves/) | The medium-property paragraph uses आपेक्षिक विद्युतशीलता and आपेक्षिक चुंबकशीलता. Only the naming distinction is used; no source numerical example or equation is inserted into the proof question. |
| H5 | [CSTT, Mathematics Fundamental Glossary, English–Hindi–Marathi](https://cstt.education.gov.in/sites/default/files/fundamental-glossary-mathematics-eng-hin-marathi.pdf) | Printed p. 84: inconsistent system → असंगत निकाय; printed p. 178 lists एकक कोष्ठिका among unit-cell terms. The Hindi column is used, not the Marathi column. |
| H6 | [NCERT Hindi, Class XII Chemistry exemplar, p-block elements](https://ncert.nic.in/pdf/publication/exemplarproblem/classXII/chemistry%28hindi%29/lhep407.pdf) | Printed p. 95 / PDF p. 2: समसंरचनात्मक. The word was visually verified; no source question or option is copied into this report. |
| H7 | [CSTT, Cell Biology glossary](https://www.cstt.education.gov.in/sites/default/files/glossary-cell-biology.pdf) | Entry amphoteric compound → उभयधर्मी यौगिक. This agrees with the existing Hindi wording; no correction is warranted. |

Inspection date: 7 October 2026. The archived Tamil PDF reference checksums are recorded for reproducibility, without adding the books to the repository:

- T1 SHA256: `c6366581b01d6079b41f24612f37afb396dba4d4f8298210393f7ae5961e91d5`
- T2 SHA256: `795e7998491467c3ca1dcf9093f4b6d00ed17d5018172e2185f3198197c4427c`
- T3 SHA256: `4c7b865e71450c96793353dac6bd460242ba3433198652f108a3e51a8e6ee81a`

## Term-by-term normalization decisions

Current entries below show the terms as used in the proof, with singular/plural or grammatical endings simplified where necessary for comparison. The exact original and proposed phrases for changed production records appear in the draft sections. KEEP allows normal grammatical inflection; it does not request an otherwise unnecessary wording edit.

| English term | Current Tamil | Recommended Tamil | Current Hindi | Recommended Hindi | Reference / terminology rationale | Tamil | Hindi |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Simple harmonic motion | எளிய இசை இயக்கம் | தனிச்சீரிசை இயக்கம் | सरल आवर्त गति | सरल आवर्त गति | T1 supplies the school term; the present Tamil phrase is insufficiently specific compared with that convention. H1 directly supports the existing Hindi. | CHANGE | KEEP |
| Potential energy | நிலை ஆற்றல் | நிலை ஆற்றல் | स्थितिज ऊर्जा | स्थितिज ऊर्जा | [T4 potential-energy lookup](https://www.tamilvu.org/slet/technical_glossary/tech_engser.jsp?selsub=All&schsel=partial&editor=potential%20energy&key_sel=English) includes நிலை ஆற்றல். H1 supports Hindi. Do not substitute an electrical-only term for mechanical potential energy. | KEEP | KEEP |
| Spring | சுருள் வில் | சுருள் வில் | स्प्रिंग | स्प्रिंग | [T4 spring lookup](https://www.tamilvu.org/slet/technical_glossary/tech_engser.jsp?selsub=All&schsel=partial&editor=spring&key_sel=English) lists வில் / சுருள்வில் and சுருள் வில் in relevant entries. Existing spacing is not a scientific defect. H1 supports स्प्रिंग. | KEEP | KEEP |
| Time period of oscillation | அலைவுகளின் கால அளவு | அலைவுக்காலம் | दोलनों का आवर्तकाल | दोलनों का आवर्तकाल | T1 identifies the period-specific term; general duration is too broad. H1 supports the existing Hindi period term. The requested quantity stays period, not frequency. | CHANGE | KEEP |
| Bravais lattice | Bravais படிக அணிக்கோவை | Bravais படிக அணிக்கோவை | Bravais जालक | Bravais जालक | Retain the named lattice and crystal-lattice meaning; [NCERT Solid State](https://sathee.iitk.ac.in/ncert-books/ncert-books-theory/class-12/nbt-che-12/chem-12-unit-1-the-solid-state/) supplies the conceptual reference. There is no need to invent or enforce a new Tamil/Hindi transliteration of Bravais. This is a semantic KEEP, not a claim that these complete phrases occur verbatim in a glossary. | KEEP | KEEP |
| Unit cell | அலகுக் கூடு / அலகுக் கூடுகள் | அலகுக் கூடு / அலகுக் கூடுகள் | इकाई कोशिका / इकाई कोशिकाएँ | एकक कोष्ठिका / एकक कोष्ठिकाएँ | T3 supports the existing Tamil unit-cell word; word spacing/plural inflection is kept. H2 and H5 support the specific Hindi crystallographic term, avoiding the generic biological-cell wording. | KEEP | CHANGE |
| Body-centred unit cell | உடல் மைய அலகுக் கூடு | பொருள் மைய அலகுக் கூடு | अंतःकेंद्रित इकाई कोशिका | अंतःकेंद्रित एकक कोष्ठिका | T3 supports பொருள் மைய, instead of anatomical உடல். H2 supports the current Hindi body-centred component; only its unit-cell component changes. Do not add cubic/घनीय/கனச்சதுர because the English question covers all Bravais types. | CHANGE | CHANGE |
| Hollow bones | உள்ளீடற்ற நீண்ட எலும்புகள் | உள்ளீடற்ற நீண்ட எலும்புகள் | खोखली लंबी हड्डियाँ | खोखली लंबी हड्डियाँ | [T4 hollow lookup](https://www.tamilvu.org/slet/technical_glossary/tech_engser.jsp?selsub=All&schsel=partial&editor=hollow&key_sel=English) supports உள்ளீடற்ற for a hollow physical form; its application to bones is a context-based semantic judgment, not a claimed biological glossary phrase. H3 supports the Hindi hollow property. | KEEP | KEEP |
| Pneumatic bones | காற்றறைகளைக் கொண்ட நீண்ட எலும்புகள் | காற்றறைகளைக் கொண்ட நீண்ட எலும்புகள் | वायुयुक्त लंबी हड्डियाँ | वायुकोष युक्त लंबी हड्डियाँ | H3 supplies the explicit air-sac property. Tamil already expresses air cavities, so its descriptive equivalent is kept. Hindi is made more precise than simply air-containing; this is curriculum normalization, not a claim that the old sentence reversed the science. | KEEP | CHANGE |
| Relative electric permittivity | சார்பு மின்காப்பு எண் | சார்பு மின் விடுதிறன் | आपेक्षिक विद्युतशीलता | आपेक्षिक विद्युतशीलता | T2 supports the school permittivity term with the relative qualifier. The proposal adds the electric qualifier from the canonical concept; it does not claim the whole composite phrase is a verbatim glossary entry. Avoid the less precise generic dielectric-number wording. H4 supports existing Hindi. | CHANGE | KEEP |
| Relative magnetic permeability | சார்பு காந்த ஊடுருவுதிறன் | சார்பு காந்த உட்புகுதிறன் | आपेक्षिक चुंबकीय पारगम्यता | आपेक्षिक चुंबकशीलता | T2 supplies relative permeability as சார்பு உட்புகுதிறன்; காந்த is retained to distinguish the magnetic property. H4 supplies the NCERT permeability name. Existing broad permeability synonyms are normalized for subject precision, without changing the physical quantity. | CHANGE | CHANGE |
| Inconsistent system of equations | நேரியல் சமன்பாடுகளின் தொகுப்பு … முரண்பாடானது | நேரியல் சமன்பாடுகளின் தொகுப்பு … முரண்பாடானது | रैखिक समीकरणों का निकाय … असंगत | रैखिक समीकरणों का निकाय … असंगत | H5 directly supports असंगत निकाय. [T4 inconsistent lookup](https://www.tamilvu.org/slet/technical_glossary/tech_engser.jsp?selsub=All&schsel=partial&editor=inconsistent&key_sel=English) gives subject-dependent alternatives including ஒவ்வாத and முரண்பாடான. In this already explicit equation-system context, the current Tamil conveys inconsistency, not dependence; a synonym swap is unnecessary. | KEEP | KEEP |
| Isostructural | ஒரே கட்டமைப்பைக் கொண்ட | ஒரே கட்டமைப்பைக் கொண்ட | समसंरचनात्मक | समसंरचनात्मक | [T4 isostructural lookup](https://www.tamilvu.org/slet/technical_glossary/tech_engser.jsp?selsub=All&schsel=partial&editor=isostructural&key_sel=English) gives சமகட்டமைப்புடைய in Engineering and Technology. Existing Tamil is its transparent descriptive equivalent, kept by semantic judgment. H6 directly verifies the Hindi term. No substitution with isoelectronic is allowed. | KEEP | KEEP |
| Amphoteric compound | ஈரியல்புச் சேர்மம் | ஈரியல்புச் சேர்மம் | उभयधर्मी यौगिक | उभयधर्मी यौगिक | [T4 amphoteric lookup](https://www.tamilvu.org/slet/technical_glossary/tech_engser.jsp?selsub=All&schsel=partial&editor=amphoteric&key_sel=English) gives ஈரியல்புள்ள in Chemistry; T3 corroborates the amphoteric root. The compound phrase is a valid composition. H7 directly supports Hindi. The chemistry context disambiguates the twofold acid/base property. | KEEP | KEEP |
| Retardation factor — additional previously flagged distractor | தடை காரணி | ஒடுக்கக் காரணி | मंदन गुणक | मंदन गुणक | [T4 retardation lookup](https://www.tamilvu.org/slet/technical_glossary/tech_engser.jsp?selsub=All&schsel=partial&editor=retardation&key_sel=English) gives ஒடுக்கம் in Physics/Chemistry. The proposed factor phrase is an editorial composition, not an attested whole glossary entry. It narrows generic obstruction to retardation/slowing and preserves this distractor. Hindi already expresses retardation plus factor, retained by semantic comparison. | CHANGE | KEEP |

The 14 requested terms are covered, plus the Tamil ecology-question distractor raised in the prior editorial review. No unreferenced alternative is represented as an official curriculum quotation. KEEP decisions for descriptive equivalents are explicitly contextual, and no proposed term introduces an identifying fact or solution method into the student-facing question.

## Exact disposition of the 20 current production translations

| Proof question | Canonical historical identity | Question ID | Language | Translation ID | Editorial recommendation | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `historical-verified:neet:2021:m4:3` | `cmumlu0g90001o6lc3yl96p6f` | Tamil | `qt-v1-646c58c553d33fcca20325e5f7d0d7b2` | **NEEDS_CORRECTION** | Use the Class XI school glossary term for simple harmonic motion [T1]. |
| 1 | `historical-verified:neet:2021:m4:3` | `cmumlu0g90001o6lc3yl96p6f` | Hindi | `qt-v1-b1ea1c949179cb1a41aef09b64113f27` | **READY_TO_APPROVE** | KEEP: technical terms and full-question meaning remain equivalent; see the semantic review below. |
| 2 | `historical-verified:neet:2021:m4:15` | `cmumlu1bo000bo6lceckqz28w` | Tamil | `qt-v1-e43070091bfce66b095e289485ed4186` | **NEEDS_CORRECTION** | Distinguish oscillation period from a general time duration; use the Class XI glossary term [T1]. |
| 2 | `historical-verified:neet:2021:m4:15` | `cmumlu1bo000bo6lceckqz28w` | Hindi | `qt-v1-fcd93e7c9f16267785d43385db861f75` | **READY_TO_APPROVE** | KEEP: technical terms and full-question meaning remain equivalent; see the semantic review below. |
| 3 | `historical-verified:neet:2021:m4:52` | `cmumlu4k00024o6lc5pn89xy6` | Tamil | `qt-v1-cf9fc1cbebda5ff75bc0d883192cb23e` | **NEEDS_CORRECTION** | Use the crystallography component in the Class XII chemistry glossary [T3]; do not add a cubic-only restriction. |
| 3 | `historical-verified:neet:2021:m4:52` | `cmumlu4k00024o6lc5pn89xy6` | Hindi | `qt-v1-040b0700fde35355916e66981dcdd472` | **NEEDS_CORRECTION** | Use the NCERT crystallographic unit-cell term [H2]; retain the existing body-centred term. |
| 4 | `historical-verified:neet:2021:m4:101` | `cmumluaux005no6lcmyvfv1rl` | Tamil | `qt-v1-3b5b00c8b0b4763785a0704bf7e42813` | **NEEDS_CORRECTION** | Preserve the English distractor Retardation factor as a retardation/slowing factor, rather than a generic obstruction factor [T4]. Only canonical option B changes wording. |
| 4 | `historical-verified:neet:2021:m4:101` | `cmumluaux005no6lcmyvfv1rl` | Hindi | `qt-v1-c0a32d561bac3b498692a5101c571ccf` | **READY_TO_APPROVE** | KEEP: technical terms and full-question meaning remain equivalent; see the semantic review below. |
| 5 | `historical-verified:neet:2021:m4:151` | `cmumlum0b00bvo6lchsmy2rse` | Tamil | `qt-v1-2f33efe7d1ffc7298adace5c114741f4` | **READY_TO_APPROVE** | KEEP: technical terms and full-question meaning remain equivalent; see the semantic review below. |
| 5 | `historical-verified:neet:2021:m4:151` | `cmumlum0b00bvo6lchsmy2rse` | Hindi | `qt-v1-e08e8eb3d7a0405bb9530987d939185e` | **NEEDS_CORRECTION** | Make the pneumatic-bone property explicit using the NCERT Animal Kingdom terminology [H3]. |
| 6 | `jee-main-2021-s1-2021-02-24-shift-1-q29-nta-70819115182` | `cmuwt6e9x003co69s06p8mked` | Tamil | `qt-v1-2ad7ed70a5ba2d8be27f17e5bfdfb75a` | **NEEDS_CORRECTION** | Use the school term for permittivity [T2], retain the relative qualifier and distinguish it from magnetic permeability. Use the school glossary component for relative magnetic permeability [T2]. |
| 6 | `jee-main-2021-s1-2021-02-24-shift-1-q29-nta-70819115182` | `cmuwt6e9x003co69s06p8mked` | Hindi | `qt-v1-247b1c8c5203aa14a0d597c72f624fc4` | **NEEDS_CORRECTION** | Align magnetic permeability with the NCERT electromagnetic-wave term [H4]; keep electric permittivity distinct. |
| 7 | `jee-main-2021-s1-2021-02-24-shift-1-q63-nta-70819115216` | `cmuwt6vkn0070o69se3143bhu` | Tamil | `qt-v1-6f2d41dba057a03bec86d736eb74fbaf` | **READY_TO_APPROVE** | KEEP: technical terms and full-question meaning remain equivalent; see the semantic review below. |
| 7 | `jee-main-2021-s1-2021-02-24-shift-1-q63-nta-70819115216` | `cmuwt6vkn0070o69se3143bhu` | Hindi | `qt-v1-6e7b77cec506e2460a674a79b82a6531` | **READY_TO_APPROVE** | KEEP: technical terms and full-question meaning remain equivalent; see the semantic review below. |
| 8 | `jee-main-2021-s1-2021-02-24-shift-1-q86-nta-70819115239` | `cmuwt7acl00a6o69sqpvyjuc9` | Tamil | `qt-v1-d981b2bbf3551989c3056509f61eaeab` | **READY_TO_APPROVE** | KEEP: technical terms and full-question meaning remain equivalent; see the semantic review below. |
| 8 | `jee-main-2021-s1-2021-02-24-shift-1-q86-nta-70819115239` | `cmuwt7acl00a6o69sqpvyjuc9` | Hindi | `qt-v1-fc6628984bf1bc107a17f8592e04b964` | **READY_TO_APPROVE** | KEEP: technical terms and full-question meaning remain equivalent; see the semantic review below. |
| 9 | `jee-main-2021-s1-2021-02-24-shift-1-q31-nta-70819115184` | `cmuwt6fuu003oo69sv0yfaqfo` | Tamil | `qt-v1-eead2c2dd706a882c3d3d4db97ad9c4e` | **READY_TO_APPROVE** | KEEP: technical terms and full-question meaning remain equivalent; see the semantic review below. |
| 9 | `jee-main-2021-s1-2021-02-24-shift-1-q31-nta-70819115184` | `cmuwt6fuu003oo69sv0yfaqfo` | Hindi | `qt-v1-416e3670196399bc59ec43bd7d8cf45e` | **READY_TO_APPROVE** | KEEP: technical terms and full-question meaning remain equivalent; see the semantic review below. |
| 10 | `jee-main-2021-s1-2021-02-24-shift-1-q59-nta-70819115212` | `cmuwt6u2m006oo69s4l58smwq` | Tamil | `qt-v1-541380c5e35d3dc31b9733c15848fde6` | **READY_TO_APPROVE** | KEEP: technical terms and full-question meaning remain equivalent; see the semantic review below. |
| 10 | `jee-main-2021-s1-2021-02-24-shift-1-q59-nta-70819115212` | `cmuwt6u2m006oo69s4l58smwq` | Hindi | `qt-v1-5ee9194425a6b79e6c65700202191964` | **READY_TO_APPROVE** | KEEP: technical terms and full-question meaning remain equivalent; see the semantic review below. |

## Proposed revised wording — only eight translations

Each section below is a local replacement draft. Only the listed field(s) differ. Unchanged translations are not rewritten. Numerical questions continue to have no A/B/C/D answer options. No key, answer value, explanation or hint is added to these drafts.

### Question 1 — Tamil

Question ID: `cmumlu0g90001o6lc3yl96p6f`

Translation ID: `qt-v1-646c58c553d33fcca20325e5f7d0d7b2`

Historical identity: `historical-verified:neet:2021:m4:3`

Current production recommendation: **NEEDS_CORRECTION**. Production state remains **REVIEW_REQUIRED**.

| Field | Current phrase | Proposed phrase |
| --- | --- | --- |
| questionText | எளிய இசை இயக்கத்தில் | தனிச்சீரிசை இயக்கத்தில் |

**Proposed question text**

```text
ஒரு பொருள் ‘n’ அதிர்வெண்ணுடன் தனிச்சீரிசை இயக்கத்தில் இயங்குகிறது. அதன் நிலை ஆற்றலின் அதிர்வெண்:
```

**Proposed options in canonical order**

| Slot | Text |
| --- | --- |
| A | n |
| B | 2n |
| C | 3n |
| D | 4n |

All unlisted fields, canonical option identities and answer fields remain unchanged. This is not a deployable or authorized write payload.

### Question 2 — Tamil

Question ID: `cmumlu1bo000bo6lceckqz28w`

Translation ID: `qt-v1-e43070091bfce66b095e289485ed4186`

Historical identity: `historical-verified:neet:2021:m4:15`

Current production recommendation: **NEEDS_CORRECTION**. Production state remains **REVIEW_REQUIRED**.

| Field | Current phrase | Proposed phrase |
| --- | --- | --- |
| questionText | ஏற்படும் அலைவுகளின் கால அளவு | அதன் அலைவுக்காலம் |

**Proposed question text**

```text
10 N விசையால் ஒரு சுருள் வில் 5 cm நீட்டப்படுகிறது. அதில் 2 kg நிறையுள்ள பொருளைத் தொங்கவிடும்போது அதன் அலைவுக்காலம்:
```

**Proposed options in canonical order**

| Slot | Text |
| --- | --- |
| A | 0.0628 s |
| B | 6.28 s |
| C | 3.14 s |
| D | 0.628 s |

All unlisted fields, canonical option identities and answer fields remain unchanged. This is not a deployable or authorized write payload.

### Question 3 — Tamil

Question ID: `cmumlu4k00024o6lc5pn89xy6`

Translation ID: `qt-v1-cf9fc1cbebda5ff75bc0d883192cb23e`

Historical identity: `historical-verified:neet:2021:m4:52`

Current production recommendation: **NEEDS_CORRECTION**. Production state remains **REVIEW_REQUIRED**.

| Field | Current phrase | Proposed phrase |
| --- | --- | --- |
| questionText | உடல் மைய | பொருள் மைய |

**Proposed question text**

```text
Bravais படிக அணிக்கோவையின் 14 வகை அலகுக் கூடுகளிலும், பொருள் மைய அலகுக் கூடுகளின் எண்ணிக்கைக்கான சரியான விடை:
```

**Proposed options in canonical order**

| Slot | Text |
| --- | --- |
| A | 7 |
| B | 5 |
| C | 2 |
| D | 3 |

All unlisted fields, canonical option identities and answer fields remain unchanged. This is not a deployable or authorized write payload.

### Question 3 — Hindi

Question ID: `cmumlu4k00024o6lc5pn89xy6`

Translation ID: `qt-v1-040b0700fde35355916e66981dcdd472`

Historical identity: `historical-verified:neet:2021:m4:52`

Current production recommendation: **NEEDS_CORRECTION**. Production state remains **REVIEW_REQUIRED**.

| Field | Current phrase | Proposed phrase |
| --- | --- | --- |
| questionText | इकाई कोशिकाओं | एकक कोष्ठिकाओं |

**Proposed question text**

```text
Bravais जालक की सभी 14 प्रकार की एकक कोष्ठिकाओं में अंतःकेंद्रित एकक कोष्ठिकाओं की संख्या का सही विकल्प है:
```

**Proposed options in canonical order**

| Slot | Text |
| --- | --- |
| A | 7 |
| B | 5 |
| C | 2 |
| D | 3 |

All unlisted fields, canonical option identities and answer fields remain unchanged. This is not a deployable or authorized write payload.

### Question 4 — Tamil

Question ID: `cmumluaux005no6lcmyvfv1rl`

Translation ID: `qt-v1-3b5b00c8b0b4763785a0704bf7e42813`

Historical identity: `historical-verified:neet:2021:m4:101`

Current production recommendation: **NEEDS_CORRECTION**. Production state remains **REVIEW_REQUIRED**.

| Field | Current phrase | Proposed phrase |
| --- | --- | --- |
| optionB | தடை காரணி | ஒடுக்கக் காரணி |

**Proposed question text**

```text
GPP − R = NPP என்ற சமன்பாட்டில் R குறிப்பது:
```

**Proposed options in canonical order**

| Slot | Text |
| --- | --- |
| A | கதிர்வீச்சு ஆற்றல் |
| B | ஒடுக்கக் காரணி |
| C | சுற்றுச்சூழல் காரணி |
| D | சுவாச இழப்புகள் |

All unlisted fields, canonical option identities and answer fields remain unchanged. This is not a deployable or authorized write payload.

### Question 5 — Hindi

Question ID: `cmumlum0b00bvo6lchsmy2rse`

Translation ID: `qt-v1-e08e8eb3d7a0405bb9530987d939185e`

Historical identity: `historical-verified:neet:2021:m4:151`

Current production recommendation: **NEEDS_CORRECTION**. Production state remains **REVIEW_REQUIRED**.

| Field | Current phrase | Proposed phrase |
| --- | --- | --- |
| questionText | वायुयुक्त | वायुकोष युक्त |

**Proposed question text**

```text
निम्नलिखित में से किस जीव में खोखली और वायुकोष युक्त लंबी हड्डियाँ होती हैं?
```

**Proposed options in canonical order**

| Slot | Text |
| --- | --- |
| A | Neophron |
| B | Hemidactylus |
| C | Macropus |
| D | Ornithorhynchus |

All unlisted fields, canonical option identities and answer fields remain unchanged. This is not a deployable or authorized write payload.

### Question 6 — Tamil

Question ID: `cmuwt6e9x003co69s06p8mked`

Translation ID: `qt-v1-2ad7ed70a5ba2d8be27f17e5bfdfb75a`

Historical identity: `jee-main-2021-s1-2021-02-24-shift-1-q29-nta-70819115182`

Current production recommendation: **NEEDS_CORRECTION**. Production state remains **REVIEW_REQUIRED**.

| Field | Current phrase | Proposed phrase |
| --- | --- | --- |
| questionText | சார்பு மின்காப்பு எண் | சார்பு மின் விடுதிறன் |
| questionText | சார்பு காந்த ஊடுருவுதிறன் | சார்பு காந்த உட்புகுதிறன் |

**Proposed question text**

```text
5 GHz அதிர்வெண் கொண்ட மின்காந்த அலை, சார்பு மின் விடுதிறன் மற்றும் சார்பு காந்த உட்புகுதிறன் இரண்டும் 2 ஆக உள்ள ஓர் ஊடகத்தில் பயணிக்கிறது. இந்த ஊடகத்தில் அதன் திசைவேகம் ______ × 10⁷ m/s.
```

Options A/B/C/D: **N/A — zero answer options, unchanged.**

All unlisted fields, canonical option identities and answer fields remain unchanged. This is not a deployable or authorized write payload.

### Question 6 — Hindi

Question ID: `cmuwt6e9x003co69s06p8mked`

Translation ID: `qt-v1-247b1c8c5203aa14a0d597c72f624fc4`

Historical identity: `jee-main-2021-s1-2021-02-24-shift-1-q29-nta-70819115182`

Current production recommendation: **NEEDS_CORRECTION**. Production state remains **REVIEW_REQUIRED**.

| Field | Current phrase | Proposed phrase |
| --- | --- | --- |
| questionText | आपेक्षिक चुंबकीय पारगम्यता | आपेक्षिक चुंबकशीलता |

**Proposed question text**

```text
5 GHz आवृत्ति की एक विद्युतचुंबकीय तरंग ऐसे माध्यम में चल रही है जिसकी आपेक्षिक विद्युतशीलता और आपेक्षिक चुंबकशीलता दोनों 2 हैं। इस माध्यम में उसका वेग ______ × 10⁷ m/s है।
```

Options A/B/C/D: **N/A — zero answer options, unchanged.**

All unlisted fields, canonical option identities and answer fields remain unchanged. This is not a deployable or authorized write payload.

## Re-run QA results

The evaluated wording is the proposed replacement for the eight NEEDS_CORRECTION rows and the unchanged current wording for the twelve READY_TO_APPROVE rows.

- **Formula QA (automated):** existing `translationQa` protected token multisets plus exact scientific spans, mathematical option text and labelled chemical-pair bindings.
- **Number QA (automated):** per-field numeral/decimal/superscript/subscript multisets against English and the current translation.
- **Unit QA (automated):** per-field unit symbols and quantity-unit pairs; reordered grammar does not reassign a quantity to a unit.
- **Option identity QA:** automated exact slot comparison for all unchanged options and exact allowlist verification for Tamil question 4 option B; its semantic identity is separately checked against English Retardation factor. The option is not moved or replaced by another distractor. MCQ count remains four; numerical count remains zero.
- **Semantic equivalence QA (editorial desk review, not an automated proof):** English/back-translation comparison of what is asked, qualifiers, relations, distractors and absence of new hints. The per-question rationale follows. This pass does not record an independent human sign-off.

| Question | Language | Formula QA | Number QA | Unit QA | Option identity QA | Semantic equivalence QA | Numerical answer unchanged |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Tamil | PASS | PASS | PASS | PASS | PASS (desk review) | N/A |
| 1 | Hindi | PASS | PASS | PASS | PASS | PASS (desk review) | N/A |
| 2 | Tamil | PASS | PASS | PASS | PASS | PASS (desk review) | N/A |
| 2 | Hindi | PASS | PASS | PASS | PASS | PASS (desk review) | N/A |
| 3 | Tamil | PASS | PASS | PASS | PASS | PASS (desk review) | N/A |
| 3 | Hindi | PASS | PASS | PASS | PASS | PASS (desk review) | N/A |
| 4 | Tamil | PASS | PASS | PASS | PASS | PASS (desk review) | N/A |
| 4 | Hindi | PASS | PASS | PASS | PASS | PASS (desk review) | N/A |
| 5 | Tamil | PASS | PASS | PASS | PASS | PASS (desk review) | N/A |
| 5 | Hindi | PASS | PASS | PASS | PASS | PASS (desk review) | N/A |
| 6 | Tamil | PASS | PASS | PASS | PASS | PASS (desk review) | PASS |
| 6 | Hindi | PASS | PASS | PASS | PASS | PASS (desk review) | PASS |
| 7 | Tamil | PASS | PASS | PASS | PASS | PASS (desk review) | N/A |
| 7 | Hindi | PASS | PASS | PASS | PASS | PASS (desk review) | N/A |
| 8 | Tamil | PASS | PASS | PASS | PASS | PASS (desk review) | PASS |
| 8 | Hindi | PASS | PASS | PASS | PASS | PASS (desk review) | PASS |
| 9 | Tamil | PASS | PASS | PASS | PASS | PASS (desk review) | N/A |
| 9 | Hindi | PASS | PASS | PASS | PASS | PASS (desk review) | N/A |
| 10 | Tamil | PASS | PASS | PASS | PASS | PASS (desk review) | PASS |
| 10 | Hindi | PASS | PASS | PASS | PASS | PASS (desk review) | PASS |

QA totals: formula 20/20 PASS; number 20/20 PASS; unit 20/20 PASS; option identity 20/20 PASS; semantic desk review 20/20 PASS **on evaluated wording**. Numerical-answer preservation: 6 PASS / 14 N/A. A vacuous unit/formula PASS means no such span exists in that question; it is not a claim of scientific content validation beyond the checks described.

| Question | Semantic comparison against canonical English — applies independently to both languages |
| --- | --- |
| 1 | A body executes SHM at frequency ‘n’; the question asks for the frequency of potential energy, not displacement or total energy. Four n/2n/3n/4n slots remain exact. |
| 2 | Force 10 N produces extension 5 cm; a suspended mass of 2 kg is specified. The request remains the period of oscillation, not frequency or total duration. All four time-valued distractors stay exact. |
| 3 | Count body-centred unit cells among all 14 Bravais types. No restriction to cubic cells is introduced. The unit-cell terminology is corrected without changing the set being counted or any numeric option. |
| 4 | R is the unknown meaning in GPP − R = NPP. Tamil B still denotes Retardation factor after its lexical correction; it is not replaced by Respiration losses or merged with another distractor. All four slot meanings are separately checked. |
| 5 | Both hollow and pneumatic properties of long bones remain required. The Tamil descriptive air-cavity wording remains valid; Hindi names air sacs explicitly. No organism name is transliterated, reordered or identified as the answer. |
| 6 | An electromagnetic wave of 5 GHz travels in a medium with both relative electric permittivity and relative magnetic permeability equal to 2. The blank remains the coefficient of × 10⁷ m/s. Neither property becomes an absolute quantity or exchanges roles. |
| 7 | The same three linear equations are presented. The qualifier is inconsistent (no common solution), not dependent or underdetermined. Each k/m condition, ≠ sign and real-number membership stays in its canonical slot. |
| 8 | The minimum α is requested for at least one solution of the unchanged equation in the open interval (0, π/2). Minimum, existence and the interval are all retained. |
| 9 | Select isostructural pairs, not isoelectronic pairs or merely compounds with the same formula. Each labelled chemical pair and the ONLY qualifiers in every answer combination remain bound to their original slots. |
| 10 | Count amphoteric compounds, not all oxides or all hydroxides. The four labelled compounds are statement entries, not MCQ answer options. No acid/base reaction explanation or identifying hint is added. |

All ten canonical content hashes, which include answer identity and numerical tolerance, match the sealed proof. No translated answer field is populated; canonical answers remain inherited from English. The production SELECT snapshot is identical before and after preparing this report. Protected local proof, canonical datasets and the prior editorial report have identical SHA256 values before and after.

## Stop point

**READY_TO_APPROVE: 12 current translations. NEEDS_CORRECTION: 8 current translations.** The eight proposed revisions still require a separately authorized production correction and a separate editorial approval decision; neither is performed here.

Production writes: **0**. Translation edits: **0**. Approvals/rejections: **0**. Migrations: **0**. Deployments: **0**. Canonical English edits: **0**.
