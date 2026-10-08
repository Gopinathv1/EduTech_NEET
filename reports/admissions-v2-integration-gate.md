# Admissions V2 — GitHub integration gate

Reviewed 2026-10-08. **PASS for local integration of destination discovery and counselling. Push/deployment are not authorized by this gate.**

## Verified Git state

| Reference | Exact SHA |
| --- | --- |
| Fetched `origin/main` | `20386f3af7471020e14bc4096b309443192cf519` |
| Approved previous production baseline | `20386f3af7471020e14bc4096b309443192cf519` |
| Admissions application commit | `a7af9f044ff76b828faf1b2381976357947ff021` |
| Admissions release/report tip | `ba85214bb3bddbb3ce78ba61a1f2155c6dc85701` |
| Local integration merge | `71a9b23cd4bb174ebaec8c155a9ce464a84a346b` |

Remote: `https://github.com/Gopinathv1/EduTech_NEET.git`. `git fetch origin main` succeeded. Remote main had not advanced from the approved baseline. Both release commits are present and their ancestry is application → baseline, report → application. The release worktree was clean before integration.

Temporary local branch: `codex/admissions-v2-integration-gate`, created from fetched `origin/main` in the existing isolated Admissions worktree. It has no upstream configured. Admissions was merged with `--no-ff`; first parent is fetched main and second parent is the release/report tip. No direct merge into main, reset, force push or main overwrite. The release branch remains at the original report tip. Other worktrees, including multilingual V2 branches and `.sanity-review/`, were not modified by this task.

## Conflict resolution and tree identity

CONFLICTS: None. No manual resolutions or integration edits were needed.

The integration merge and release tip have exactly the same tree: `508430824dc753f96c7377c9dd9d3441467c3e39`. `git diff codex/admissions-v2-rework 71a9b23cd4bb174ebaec8c155a9ce464a84a346b` was empty. The merge changes 44 files relative to fetched main; those are exactly the 43-file code candidate and its release report. This gate is added in a documentation-only follow-up commit on the temporary branch; it does not alter runtime code or the release branch.

## Release scope verification

- Russia remains under Asia navigation and explicitly transcontinental across Europe and Asia. Kazakhstan/Caucasus geography remains qualified; canonical country metadata drives filters.
- University identities include official Orenburg and Armenian Medical Institute sources. The Armenian faculty suffix is removed; current accreditation is explicitly not inferred from identity or an older register entry.
- Programme information is source-scoped and dated; multiple Jalal-Abad tracks require applicant-specific confirmation. Tuition/living-cost values are not invented; current intake, costs, clinical language, internship and eligibility require confirmation.
- NMC/NEET guidance remains separate from university admission, visa and professional registration; no guarantees.
- Counselling forms retain explicit consent and shared validation. Public enquiry transaction/advisory-lock deduplication and per-IP rate limiting remain. Student counselling leads retain transactional duplicate prevention and validation of every selected country.
- Active-admin authorization and inactive-assignee rejection remain on admissions/admin APIs. Counselling conversion is labelled “Counselling lead converted,” not enrolment or a university admission decision.
- University discovery/comparison and targeted mobile/desktop fixes remain. Genuine university-application tracking is excluded; its proposal is documentation only.
- No Prisma schema/migration, translation-resource, multilingual Batch 01/02 or exam-engine changes. Protected engine/translation/schema paths match fetched main; the complete diff contains no unrelated files, environment files, generated database/test records or temporary scripts. The prior candidate credential/artifact scan remains applicable because the integration tree is identical.

## Validation

Executed on the local integration merge:

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed; no ESLint warnings/errors |
| Focused Vitest, seven files | 78 passed |
| `git diff origin/main HEAD --check` | Passed |
| Release/integration tree comparison | Identical |
| Main/release references and working tree | Unchanged main/release refs; clean after merge |

Focused test files: `tests/admission.test.ts`, `tests/admissions-v2.test.ts`, `tests/exam-state.test.ts`, `tests/student-exam-presentation.test.ts`, `tests/question-translations.test.ts`, `tests/question-translation-workflow.test.ts`, `tests/question-translation-payload.test.ts`. These cover admissions plus focused exam-state/student presentation and multilingual V1 safeguards; this is not a claim of a fresh exhaustive NEET/JEE browser regression.

Build: not repeated, because fetched main is unchanged and the integration tree exactly matches the successful candidate. Reused the recent successful production build recorded in `admissions-v2-release-candidate.md`. Browser evidence: reused the candidate's 12 passing production-mode paths (six desktop, six mobile; 39.9 seconds), including counselling consent/persistence/deduplication, rate limiting, admin authorization, geography/navigation, comparisons and status semantics. Full 582-test regression was not repeated unnecessarily.

Existing Next workspace-root/deprecation and Vitest config warnings remain non-failing. Earlier development-mode interaction timing failures, temporary isolated-database interruption and unavailable external source fetch are documented in the release/final-review reports; final candidate production-mode browser checks passed. No network-dependent live Vercel check was attempted. Integration tests required no database writes or outbound communications; no production database, migration or deployment command was run.

Local generated check logs (not committed): `tmp/admissions-integration-typecheck.log`, `tmp/admissions-integration-lint.log`, `tmp/admissions-integration-tests.log`.

## Changed files relative to fetched main (44)

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
- `e2e/fixtures/admissions-v2.ts`
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
- `reports/admissions-v2-application-tracking-proposal.md`
- `reports/admissions-v2-final-review.md`
- `reports/admissions-v2-release-candidate.md`
- `tests/admission.test.ts`
- `tests/admissions-v2.test.ts`

Documentation follow-up: `reports/admissions-v2-integration-gate.md`.

## Rollback reference and subsequent release gates

Rollback baseline: `20386f3af7471020e14bc4096b309443192cf519`. No rollback was executed. The temporary merge is local and main remains unchanged, so there is no production rollback to perform now. If this merge is later included in an authorized release and must be reverted, prepare a reviewed revert of the actual released merge with the correct mainline parent, or use the approved prior deployment through the release process. Preserve all enquiry/student data; no database down-migration is required. A broad revert removes authorization/deduplication fixes, so prefer a targeted corrective release when those protections must remain. Never reset shared main or force push.

Release recommendation: **PASS — Admissions V2 discovery and counselling can proceed to separately authorized GitHub integration.** This gate validates the currently fetched main only; fetch/re-evaluate if main advances before integration. Full university-application tracking remains deferred and is outside this candidate. Accreditation, programme suitability, intake, itemised costs, eligibility and cohort-specific licensing still require confirmation before individual enrolment/payment advice. Live Vercel/production smoke verification remains a release-time gate.

PUSH: NO. MERGE INTO MAIN: NO. DEPLOYMENT: NO. PRODUCTION DATABASE WRITES: NO. PRODUCTION MIGRATIONS: NO. REAL STUDENT COMMUNICATIONS: NO.
