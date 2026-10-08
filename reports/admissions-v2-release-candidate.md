# Admissions V2 — discovery and counselling release candidate

Reviewed 2026-10-08. **Ready for release review within the discovery and counselling scope. Stop before release.**

Release candidate code commit: `a7af9f044ff76b828faf1b2381976357947ff021`.
Approved baseline / parent: `20386f3af7471020e14bc4096b309443192cf519`.
Branch: `codex/admissions-v2-rework`.
Worktree: `C:\Users\gopis\.codex\worktrees\admissions-v2-rework\EduTech_NEET`.

This report is recorded in a separate documentation-only commit immediately after the code commit so it can name the exact immutable code SHA. It does not change the tested application. The branch tip includes both commits; no push, merge, deployment or live Vercel inspection has occurred.

## Release scope

- Canonical country identifiers, flags and continent filters; Russia under Asia navigation with explicit Europe/Asia geography; Kazakhstan and Caucasus descriptions qualified appropriately.
- Eight destinations and 34 distinct institution listings, official identity corrections, discovery/search/sorting and country/university comparison.
- Programme source review dates, applicant-specific duration caveats, fee/intake/eligibility confirmation wording and updated NMC reference link.
- Public counselling forms with explicit consent, contact preference, country/university context and saved references. Existing ContactEnquiry persistence, advisory-lock deduplication and per-IP rate limiting.
- Signed-in counselling leads: official-score semantics, atomic duplicate prevention, destination validation and reliable post-submit status navigation.
- Admin lead assignment, active-account authorization, inactive-assignee rejection, notes/status workflow, searchable enquiry inbox and readable/mobile-safe controls.
- Student-facing CONVERTED means “Counselling lead converted,” never proof of enrolment or a university decision.

Excluded: university-application tracking, new database models/migrations, inferred accreditation, guaranteed prices/admission/visa/licensing, multilingual batches and exam-engine changes. The application-tracking proposal is design documentation only and adds no runtime feature.

## Final safety review

The exact 43-file code-commit manifest was checked before staging. No Batch 01/02 artifacts, translation resources, NEET/JEE engine code, Prisma schema/migrations, package/dependency changes, production environment files, secrets, database dumps or generated test records are included. Added/modified candidate text passed a credential-pattern scan and `git diff --cached --check`.

The one-off seed helper is archived locally under ignored `tmp/`, outside the commit. Reusable setup lives in `e2e/fixtures/admissions-v2.ts`; it and the browser suite reject databases other than `127.0.0.1:55441/admissions_v2_isolated`. Synthetic fixture definitions are intentional test infrastructure, not copied student records. Test database contents, screenshots, traces, logs, dependencies and build output remain ignored and uncommitted. Other worktrees and `.sanity-review/` were not modified by this task.

No production database was queried or mutated. All browser persistence tests used the dedicated local PostgreSQL database. No real communications were sent. Existing ContactEnquiry/AdmissionLead/LeadEvent schema is reused, so there is no data migration and no relabelling/backfill of historical records as university applications.

## Validation evidence

| Check | Result / evidence |
| --- | --- |
| `npm run lint` | Passed on candidate source; no ESLint warnings/errors |
| `npm run typecheck` | Passed after fixture packaging |
| `npm run build` | Reused the recent successful production build of identical application source from final blocker resolution; release packaging changed only tests/documentation |
| `npx vitest run tests/admission.test.ts tests/admissions-v2.test.ts` | 23 passed in release check |
| `npx playwright test --config playwright.admissions.config.ts` | 12 passed, 39.9 seconds, production-mode local server; six desktop and six mobile |
| Whitespace / staged scope | Passed; exactly 43 intended files |
| Full regression | Not repeated; prior 582 passes / three skips retained as historical evidence |

Browser coverage includes Asia/Europe filters and Russia geography, institution identity source links and accreditation caveat, discovery/comparison, consent/preferences/reference persistence, concurrent duplicate safety, invalid requests/rate limiting, student form/status navigation, assignment/notes, disabled/anonymous/other-student authorization, failed-save feedback and document overflow. Desktop viewport 1440 × 1000; mobile 390 × 844. Screenshots were visually reviewed during implementation; the latest release paths passed on both sizes.

Local evidence: `tmp/admissions-release-lint.log`, `tmp/admissions-release-typecheck.log`, `tmp/admissions-release-tests.log`, `tmp/admissions-release-browser.log`, and the prior `tmp/admissions-blockers-build.log`. These generated logs are deliberately outside Git.

Limitations retained transparently: an earlier development-mode run had two inbox interaction failures without status PATCH requests; production-mode reruns passed, including this release run. The successful build recorded existing workspace-root/telemetry warnings and temporary isolated-database unavailability during a server switch. External Nam Can Tho source fetching timed out independently of app tests. Live Vercel/production smoke checks are deferred to separately authorized release work. No current source or runtime changes require another full regression run.

## Remaining factual confirmation requirements

Official identity links establish identity, not current accreditation, admission availability or Indian registration eligibility. Armenian Medical Institute's older ANQA register entry does not establish current accreditation validity; the UI explicitly requires confirmation. All eight country programme/budget objects are empty; tuition/living costs are not invented and comparison cells require university confirmation. Published programme information is dated and scoped, with current intake, applicant-specific duration, internship, teaching/clinical language, academic eligibility, itemised costs and refund terms still requiring direct confirmation before an enrolment/payment recommendation. NMC/NEET rules must be checked for the applicant's cohort; admission does not guarantee visa or professional licensing.

These limitations are displayed as confirmation requirements and do not block the independently scoped research/discovery and counselling-enquiry candidate. They do block unsupported claims or personalised guarantees.

## Deferred application tracking

Counselling enquiry, student application draft, actual university submission and university-issued decision are separate concepts. Only counselling records exist today. Genuine application tracking is excluded from this release, not represented by fabricated lead states. See `admissions-v2-application-tracking-proposal.md` for the additive schema/evidence/workflow design. Its later implementation, migration rehearsal and explicit production-migration authorization are separate work.

## Files included in the code commit (43)

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
- `tests/admission.test.ts`
- `tests/admissions-v2.test.ts`

This documentation-only follow-up additionally includes `reports/admissions-v2-release-candidate.md`.

## Rollback plan

No rollback has been executed. Before any future release, record the currently deployed SHA and retain this candidate SHA. If rollback is required after an authorized deployment, restore the previously approved deployment through the release process, or prepare a separate reviewed `git revert a7af9f044ff76b828faf1b2381976357947ff021` change. The documentation follow-up can remain or be reverted separately; it has no runtime effect. Do not reset shared history or delete student/enquiry records.

No database down-migration is required: persisted enquiries/leads use existing models. Retain all newly created records and consent text. Recheck inbox access and counselling availability after rollback; a full code revert also removes the authorization/deduplication fixes, so prefer a targeted corrective release if those protections must remain. Any actual rollback/deployment needs separate release authorization and post-action smoke checks.

## Release readiness verdict

**READY AS A LOCAL DISCOVERY AND COUNSELLING RELEASE CANDIDATE.** The scoped code is committed and focused checks passed. Full university-application tracking is explicitly deferred and is not a requirement of this candidate. Remaining factual uncertainties are clearly qualified. No release action is authorized or performed by this preparation task; live deployment verification and release approval remain subsequent gates.
