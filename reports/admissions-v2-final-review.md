# Admissions V2 final review

Development baseline: `20386f3af7471020e14bc4096b309443192cf519`. Branch: `codex/admissions-v2-rework`. Worktree: `C:\Users\gopis\.codex\worktrees\admissions-v2-rework\EduTech_NEET`.

The user approved GitHub main as the development baseline. No Vercel inspection, push, merge or deployment was performed. Existing local work was retained; the separate multilingual checkout and `.sanity-review/` were not modified by this task.

## Review and implementation

COUNTRIES REVIEWED: 8 — Russia, Georgia, Armenia, Kazakhstan, Vietnam, Uzbekistan, Kyrgyzstan and Tajikistan.

UNIVERSITIES REVIEWED: 35 original entries reduced to 34 distinct listings. Removed Stalinabad Medical Institute as a historical duplicate of Avicenna Tajik State Medical University. Updated Tashkent and several institution/faculty names against official sources. Identity references are attached to all 34 listings after the final blocker-resolution review. Identity evidence does not establish current admissions, accreditation, fees or Indian licensing eligibility.

GEOGRAPHY FIXES: Shared canonical country codes, flags, region and geography metadata now drive discovery, detail and comparison. Search, region counts, alphabetical sorting, empty results and duplicate comparison selections were corrected.

| Country | Primary navigation | Geographic description |
| --- | --- | --- |
| Russia | Asia | Transcontinental: Europe and Asia |
| Georgia | Asia | Caucasus; continental boundary varies by convention |
| Armenia | Asia | South Caucasus; UN M49 Western Asia |
| Kazakhstan | Asia | Transcontinental; predominantly Central Asia, smaller European portion west of the Ural |
| Vietnam | Asia | Southeast Asia |
| Uzbekistan | Asia | Central Asia |
| Kyrgyzstan | Asia | Central Asia |
| Tajikistan | Asia | Central Asia |

RUSSIA: Primary navigation Asia as requested, with explicit transcontinental description. This product navigation convention is distinct from UN M49's statistical grouping of Russia in Europe.

PROGRAM ACCURACY: Removed universal programme assumptions and misleading inherited university cities. Three separately sourced programme records are displayed with evidence scope; unsupported duration, language, tuition, living costs and eligibility values say “Confirm with university.” Medicine, engineering, other undergraduate and postgraduate counselling paths are separate. NEET eligibility, university admission and cohort-specific NMC requirements are distinguished. No automatic NMC recognition, admission, visa or licensing guarantee is asserted.

STUDENT JOURNEY: Removed practice-test score prefill from official NEET counselling fields. Existing signed-in counselling requests retain consent and status tracking. Duplicate submissions are serialized inside a transaction; partially invalid country selections are rejected. Tracking is explicitly counselling progress, not a university application, admission offer or visa decision. Selected university and country prefill the public enquiry. Browser validation exposed a stale same-route success link on desktop; the status link now performs a fresh navigation so the saved request is loaded reliably. A genuine university-application workflow does not exist in the current data model and remains a product gap.

COUNSELLING: Added public admissions enquiries with study path, destination, programme, contact preference and explicit consent. Validation, rate limiting, duplicate protection, retained input on failure and a saved reference are implemented. Saved enquiries enter the existing inbox; no messages or calls were sent.

ADMIN WORKFLOW: Existing assignment, follow-up notes, status events and exports remain. Admissions routes now reject inactive admins even when their JWT is still valid; assignment rejects inactive assignees. Inbox search supports references and programme/contact text. WhatsApp links now use the lead's number, contact preferences are respected, phone prefixes are normalized, and the status selector has readable contrast and save/error feedback.

MOBILE: Targeted Chromium checks use 390 × 844 with touch/mobile settings. Comparison tables scroll within their container; document overflow is checked. Forms, saved references, inbox controls and student tracking are exercised.

DESKTOP: The same journeys run at 1440 × 1000 against the built local application and isolated PostgreSQL database.

## Evidence and content limits

Country grouping reference: [UN M49](https://unstats.un.org/unsd/methodology/m49/). Country identifiers: [ISO 3166](https://www.iso.org/iso-3166-country-codes.html). Medical guidance links to [NTA NEET](https://neet.nta.nic.in/), [NMC screening regulations](https://www.nmc.org.in/rules-regulations/screening-test-regulations-2002/1000/) and [NMC gazette](https://nmc.org.in/e-gazette-nmc?page=2). Some NMC document downloads were unavailable; the UI avoids asserting detailed current numeric rules across all cohorts.

Historical duplicate evidence: [Avicenna university history](https://www.tajmedun.tj/en/university/history/). Updated Tashkent identity: [official university](https://tma.uz/en/ru-2/).

### Institution inventory

| Country | Listing | City evidence | Identity source |
| --- | --- | --- | --- |
| Russia | Omsk State Medical University | Omsk | [Official/reference source](https://omsk-osma.ru/en/contacts) |
| Russia | Orenburg State Medical University | Orenburg | [Official university](https://new.orgma.ru/en/) |
| Russia | Perm State Medical University | Perm | [Official/reference source](https://www.psma.ru/en/) |
| Russia | Mari State University — Institute of Medicine | Yoshkar-Ola | [Official/reference source](https://marsu.ru/en/Schools/facultiesInstitutes/Schools/Medicine/) |
| Russia | Tver State Medical University | Tver | [Official/reference source](https://www.wipo.int/tisc/en/search/details.jsp?id=11482) |
| Georgia | Tbilisi State Medical University Faculty of Medicine | Tbilisi | [Official/reference source](https://tsmu.edu/ts/content.php?aid=55&bid=33&cid=336&did=0&eid=0&id=3&lang=en) |
| Georgia | Batumi Shota Rustaveli State University | Batumi | [Official/reference source](https://bsu.edu.ge/sub-14/program/5/index.html?lang=en) |
| Georgia | BAU International University Batumi | Batumi | [Official/reference source](https://bauinternational.edu.ge/en/) |
| Georgia | Caucasus International University Faculty of Medicine | Tbilisi | [Official/reference source](https://www.ciu.edu.ge/?lang=en) |
| Georgia | David Tvildiani Medical University / AIETI Medical School | Tbilisi | [Official/reference source](https://old2.dtmu.ge/index.php?Cat=contact&lang=1) |
| Vietnam | Hong Bang International University Faculty of Medicine | Confirm with university | [Official/reference source](https://xethocbong.hiu.vn/en/) |
| Vietnam | Phan Chau Trinh University (PCTU) | Confirm with university | [Official/reference source](https://conference.pctu.edu.vn/home-english/) |
| Vietnam | Buon Ma Thuot University of Medicine and Pharmacy | Confirm with university | [Official/reference source](https://www.bmtu.edu.vn/) |
| Vietnam | Can Tho University of Medicine and Pharmacy | Can Tho | [Official/reference source](https://engtdhydct.ctump.edu.vn/contact-location.html) |
| Vietnam | Nam Can Tho University | Can Tho | [Official/reference source](https://nctu.edu.vn/eng/international-programs/international-medicine) |
| Armenia | Yerevan State Medical University Named for Mkhitar Heratsi | Confirm with university | [Official/reference source](https://ysmu.am/v2/wp-content/uploads/2023/05/7d738bbf.pdf) |
| Armenia | Armenian Medical Institute | Confirm with university | [Official institute](https://armedin.am/en/) |
| Armenia | Erebuni Medical Academy Foundation | Confirm with university | [Official/reference source](https://erebuniacademy.am/en/education/) |
| Armenia | Yerevan Haybusak University Faculty of Medicine | Confirm with university | [Official/reference source](https://haybusak.am/applicant-transfer/fees/) |
| Armenia | Yerevan University of Traditional Medicine | Confirm with university | [Official/reference source](https://utm.am/category/for-applicants) |
| Uzbekistan | Tashkent State Medical University | Confirm with university | [Official/reference source](https://tma.uz/en/ru-2/) |
| Uzbekistan | Bukhara State Medical Institute | Confirm with university | [Official/reference source](https://bsmi.uz/en/custom-home/) |
| Uzbekistan | Samarkand State Medical University | Confirm with university | [Official/reference source](https://www.sammu.uz/en/pages/admission_procedure_int) |
| Uzbekistan | Fergana Medical Institute of Public Health | Confirm with university | [Official/reference source](https://fjsti.uz/) |
| Uzbekistan | Andijan State Medical Institute | Confirm with university | [Official/reference source](https://adti.uz/en/announcements/112-andijon-davlat-tibbiyot-institutida-qabul-boshlandi.html) |
| Kyrgyzstan | Bishkek International Medical Institute | Confirm with university | [Official/reference source](https://bimi.edu.kg/kg/) |
| Kyrgyzstan | Avicenna International Medical University | Confirm with university | [Official/reference source](https://aimu.edu.kg/) |
| Kyrgyzstan | Osh State University — International Medical Faculty | Osh | [Official/reference source](https://www.oshsu.kg/en/page/174) |
| Kyrgyzstan | Osh International Medical University | Osh | [Official/reference source](https://www.oimu.kg/en) |
| Kyrgyzstan | Jalal-Abad International University Medical Faculty | Jalal-Abad | [Official/reference source](https://jaiu.kg/en/faculties/medical-faculty/) |
| Tajikistan | Avicenna Tajik State Medical University | Confirm with university | [Official/reference source](https://www.tajmedun.tj/en/university/history/) |
| Tajikistan | Tajik National University Faculty of Medicine | Confirm with university | [Official/reference source](https://medical.tnu.tj/en/about-faculty/) |
| Kazakhstan | Al-Farabi Kazakh National University Faculty of Medicine and Health Care | Confirm with university | [Official/reference source](https://welcome.kaznu.kz/en/19688/) |
| Kazakhstan | Asfendiyarov Kazakh National Medical University | Almaty | [Official/reference source](https://kaznmu.edu.kz/en/history-of-university/) |

Programme evidence: [Batumi medical programme](https://www.bsu.edu.ge/text_files/en_file_307_1.pdf), [Nam Can Tho international medicine](https://nctu.edu.vn/eng/international-programs/international-medicine), [Jalal-Abad International medical faculty](https://jaiu.kg/en/faculties/medical-faculty/). These support only the displayed fields; current intake and internship arrangements require confirmation.

UNVERIFIED CLAIMS: Current tuition, living expenses, intakes, deadlines, campus availability, clinical language, internship structure, rankings, accreditation and licensing suitability are not comprehensively verified. Both previously unresolved identities now have official sources. Armenian Medical Institute current accreditation validity remains unconfirmed; the older ANQA entry must not be treated as current approval. Travel/FX information is indicative, not a live quote. New admissions copy is English; existing multilingual translation files were preserved.

## Validation

TESTS: Final `npm run lint`, `npm run typecheck` and `npm run build` passed. Full regression `npm test`: 75 files passed, one skipped; 582 tests passed, three skipped. Targeted `npx vitest run tests/admission.test.ts tests/admissions-v2.test.ts`: 23 passed. Final `npx playwright test --config playwright.admissions.config.ts`: all 12 passed (six desktop, six mobile; 54.6 seconds). `git diff --check` passed. The browser suite covers real form-to-API-to-database persistence, consent/preferences, selected-university prefill, concurrency, duplicate prevention, throttling, assignment, status/notes, authorization and failed-save feedback. Visual screenshots confirmed readable admin controls and contained mobile layouts. The intermediate desktop status-navigation failure was fixed and the complete suite rerun successfully.

Tests use a new local PostgreSQL cluster, `127.0.0.1:55441/admissions_v2_isolated`, with guarded seed/test scripts and synthetic `.invalid` contacts. No production database, existing student records or outbound communication provider was used. No schema or migration change is needed. Test screenshots/traces and logs are local ignored artifacts under `test-results/`, `playwright-report/` and `tmp/`.

Build limitations: existing Next workspace-root/deprecation and telemetry dependency warnings are recorded separately from application failures. The first Prisma engine download encountered a certificate/network error; local cached engines enabled generation. External FX/source availability is not treated as an application failure. Live Vercel verification is intentionally deferred to release.

FILES CHANGED:
- `app/(admin)/admin/(portal)/contact-enquiries/page.tsx`
- `app/(admin)/admin/(portal)/leads/page.tsx`
- `app/(public)/admissions/[country]/page.tsx`
- `app/(public)/admissions/compare/page.tsx`
- `app/(public)/admissions/page.tsx`
- `app/(public)/admissions/universities/page.tsx`
- `app/(student)/student/admission-guidance/page.tsx`
- `app/api/admin/contact-enquiries/[id]/status/route.ts`
- `app/api/admin/contact-enquiries/route.ts`
- `app/api/admin/leads/[id]/assign/route.ts`
- `app/api/admin/leads/[id]/notes/route.ts`
- `app/api/admin/leads/[id]/route.ts`
- `app/api/admin/leads/[id]/status/route.ts`
- `app/api/admin/leads/export/route.ts`
- `app/api/admission/enquiries/route.ts`
- `app/api/admission/leads/route.ts`
- `components/admin/ContactStatusSelect.tsx`
- `components/admin/leads/LeadDrawer.tsx`
- `components/admissions/AdmissionsEnquiryForm.tsx`
- `components/admissions/CompareTray.tsx`
- `components/admissions/MedicalGuidance.tsx`
- `components/admissions/UniversityExplorer.tsx`
- `components/student/admission/AdmissionLeadForm.tsx`
- `components/student/admission/LeadStatusCard.tsx`
- `e2e/admissions-v2.spec.ts`
- `lib/admin/leads-service.ts`
- `lib/admission/admin-session.ts`
- `lib/admission/config.ts`
- `lib/admission/enquiries-filter.ts`
- `lib/admission/enquiries.ts`
- `lib/admission/fx.ts`
- `lib/admission/leads.ts`
- `lib/data/admissions/countries.ts`
- `lib/data/admissions/universities.ts`
- `lib/public/countries.ts`
- `lib/validation/admission.ts`
- `lib/validation/admissions-enquiry.ts`
- `playwright.admissions.config.ts`
- `reports/admissions-v2-final-review.md`
- `e2e/fixtures/admissions-v2.ts`
- `tests/admission.test.ts`
- `tests/admissions-v2.test.ts`

BLOCKERS: Genuine university-application tracking requires an additive migration and remains release-blocked. Unconfirmed programme/fee/accreditation/licensing details remain explicitly requiring confirmation and are not presented as verified guarantees. Live Vercel verification is a release-time requirement, not a development baseline blocker.

FINAL VERDICT: Implemented admissions fixes are validated and ready for development review. The full admissions product is **not release-ready**: actual application tracking must be implemented and verified; current programme/fee/accreditation details must be confirmed before advising an individual to enrol. No push, merge or deployment performed.


## Final blocker-resolution review — 2026-10-08

### Resolved issues

UNIVERSITY IDENTITIES: Both official identities verified. [Orenburg State Medical University](https://new.orgma.ru/en/) identifies itself and provides its Orenburg address; replaced the previously unavailable candidate source. [Armenian Medical Institute](https://armedin.am/en/) identifies the institute; removed the unverified “Faculty of Medicine” suffix while preserving catalogue ID `armenia-2`. The institute website is used for identity only. [ANQA's older register entry](https://www.anqa.am/en/institutional-accreditation-state-register/armenian-medical-institute/) gives a past validity date; it does not establish current accreditation. A visible institution-specific confirmation note prevents that inference. No database records were renamed, deleted or migrated.

PROGRAMME CLAIMS: Rechecked the three published programme references. Batumi's [official programme PDF](https://www.bsu.edu.ge/text_files/en_file_307_1.pdf) supports Medical doctor and English instruction; no current intake or eligibility guarantee inferred. Nam Can Tho's [official programme page](https://nctu.edu.vn/eng/international-programs/international-medicine) is indexed with programme information, but direct fetching timed out; prior supported title is retained, with no new duration/fee/licensing assertions. Jalal-Abad's [official faculty page](https://jaiu.kg/en/faculties/medical-faculty/) lists multiple tracks, so the universal six-year duration was replaced with applicant-specific confirmation. Each programme now displays source review date and a current-intake confirmation caveat.

FEE CLAIMS: All eight country `program` and `budget` objects are empty. University tuition and living-cost cells require confirmation; there are no published numeric fee estimates to certify. Student budget selections express preferences rather than university prices. No invented fee was added. Written itemised quotes and refund terms remain required before payment.

REGULATORY GUIDANCE: Rechecked the [official NMC screening/NEET page](https://nmc.org.in/page/rules-regulations-rules-regulations-of-erstwhile-mci-screening-test-regulations-2002) and updated the outdated link to the current route. Existing guidance separates NEET, university eligibility and cohort-specific Indian licensing requirements. No accreditation, admission, visa or professional licensing guarantee. Detailed regulatory applicability remains an individual/cohort verification requirement, not a blanket certification of the catalogue.

APPLICATION TRACKING: Existing `ContactEnquiry`, `AdmissionLead` and `LeadEvent` models/APIs track counselling only. The translated CONVERTED label “Enrolled” was misleading; the student card now says “Counselling lead converted,” without changing stored statuses or translation files. Public requests are enquiries; signed-in requests are counselling leads. Neither is a university application or admission decision. Genuine tracking needs new persisted institution/programme/application/evidence/decision models and an evidence-backed workflow. See [schema and workflow proposal](admissions-v2-application-tracking-proposal.md). No schema change or production migration applied. **University-application tracking remains release-blocked.**

### Focused validation

Final blocker-resolution validation: `npm run lint`, `npm run typecheck`, `npm run build` and `git diff --check` passed. Focused `npx vitest run tests/admission.test.ts tests/admissions-v2.test.ts`: 23 passed. Final `npx playwright test --config playwright.admissions.config.ts`: **12 passed** (six desktop, six mobile; 40.2 seconds) on the updated production-mode local build and isolated PostgreSQL. Coverage includes country filters/Russia, official identity links and accreditation caveat, comparison, counselling persistence/consent, duplicate protection, admin authorization, converted-lead semantics, student status navigation and error paths. The full 582-test suite was intentionally not repeated because these changes remain admissions-specific.

An earlier development-mode browser attempt had ten passes and two inbox-save failures; captured traces contained no status PATCH for those interactions. The identical functional checks passed on the final production-mode build. This is recorded as a development-mode interaction/timing limitation, not silently discarded. During the server-mode switch the isolated database process stopped and was restarted; the build logged temporary local connection errors but completed successfully. Existing workspace-root/telemetry warnings remain. Nam Can Tho's direct source fetch timed out independently of application tests. No live Vercel validation was performed.

### Files changed in this resolution phase

- `lib/data/admissions/countries.ts`
- `lib/data/admissions/universities.ts`
- `components/admissions/UniversityExplorer.tsx`
- `components/admissions/MedicalGuidance.tsx`
- `components/student/admission/LeadStatusCard.tsx`
- `tests/admissions-v2.test.ts`
- `e2e/admissions-v2.spec.ts`
- `reports/admissions-v2-application-tracking-proposal.md`
- `reports/admissions-v2-final-review.md`

REMAINING BLOCKERS: Genuine university-application tracking (schema/workflow implementation and migration approval). Current accreditation, programme suitability, clinical/internship arrangements, intake, fees and licensing for a particular applicant remain factual uncertainties, clearly requiring confirmation. They are not advertised as verified outcomes.

RELEASE RECOMMENDATION: Identity blockers resolved and misleading duration/enrolment wording corrected. Counselling/discovery scope has passed focused validation and can proceed to separately authorized release review/checks. **Do not release as a complete university-application tracking product.** No deployment, push, merge, real communications, production writes, exam-engine changes or multilingual branch changes.


## Discovery and counselling release scope

The release candidate intentionally excludes university-application tracking and all migrations. Its absent tracking workflow does not block the independently scoped discovery/counselling candidate. The separate design proposal is documentation only. The one-off local seed helper was archived under ignored `tmp/`; guarded synthetic setup is now a reusable browser-test fixture. No seed script or test database contents are included in the release. See `admissions-v2-release-candidate.md` for the exact code commit, release manifest, checks and rollback plan.
