# Admissions V2 university selection hotfix

Date: 2026-10-08 (Asia/Kolkata).

Branch: `codex/admissions-v2-university-selection-hotfix`.
Base: fetched `origin/main`, `275107a92641fc274e6a1434d24c92b24a611e37`.
Worktree: `C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/.hotfix-university`.

## Root cause and reproduction

Reproduced locally against the exact production merge: direct navigation to
`/admissions/russia?university=russia-3#enquiry` displayed Perm. Clicking the
Omsk institution link changed the URL to `university=russia-1`, but the form
continued displaying **Perm State Medical University**. The browser regression
failed with expected Omsk, received Perm. Refresh remounted the form and corrected it.

The country page resolves a route ID to a display name and passes it to
`AdmissionsEnquiryForm`. Next client navigation preserves that form component.
React Hook Form reads `defaultValues` only on mount, so changed route props did
not update the registered programme field. The form/API previously carried
only the name as free text, and the inbox message contained no university ID.
There is no localStorage/sessionStorage selection cache in this path; the stale
value was preserved React/form state, not a database ID or browser cache collision.

## Fix

- Resolve the current query university ID through the canonical university catalogue.
  The ID determines the university name and country. Key form state by country
  and university ID so a changed identity starts a fresh enquiry, including
  contact fields, consent, success state and submission lock.
- Keep the selected name read-only and the selected destination fixed. Unselected
  general enquiries retain free-text programme and destination choices.
- Block submission until hydration, during an institution Link navigation, and
  for unknown, empty, repeated or wrong-country university parameters. Recheck
  the live browser pathname/query at submission to reject stale history/navigation state.
  Ignore responses belonging to a route the user has left.
- Include `universityId` in the payload. Shared API/service validation rejects
  unknown IDs and mismatched ID/name/country combinations. Known catalogue
  university names without an ID are rejected, including submissions from old
  open tabs. Other free-text programmes remain supported.
- Persist `University ID: ...` beside the validated canonical name in the existing
  ContactEnquiry message. No schema migration, new table or historical rewrite.
  Existing transaction/advisory-lock deduplication and explicit consent remain;
  a synchronous client lock additionally prevents overlapping submissions.

## Regression coverage

Unit tests cover canonical Omsk/Perm IDs, stale name, wrong country, unknown or
missing ID and absent consent. Existing geography, discovery, enquiry validation,
student lead validation and inbox filter tests remain included.

Desktop/mobile browser tests cover Perm to Omsk, Omsk to Perm, repeated switches,
direct navigation, back/forward, refresh, invalid selection, delayed client route
responses, blocked attempted submission during navigation, and no usable submit
control before hydration. Both selected universities have payload and persisted
ID/name/country assertions, duplicate submission checks, and API rejection checks
for invalid consent, missing/unknown ID and stale name/country.

The browser suite hard-fails unless DATABASE_URL names exactly
`127.0.0.1:55441/admissions_v2_isolated`. A separate synthetic PostgreSQL cluster
was created under this worktree's ignored `tmp/hotfix-pg`; all test enquiries use
`example.invalid` addresses. No production credentials or environment files were
copied. Tests use local HTTP only and do not send outbound student messages.

Final validation results:

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed; no ESLint warnings/errors |
| Focused admissions Vitest (two files) | 24 passed |
| `npm run build` | Passed; 144 static pages generated |
| Full production-mode Admissions Playwright suite | 22 passed, 11 desktop + 11 mobile, 1.6 minutes |
| `git diff --check` | Passed |

Local evidence: `tmp/hotfix-build.log`, `tmp/hotfix-typecheck.log`,
`tmp/hotfix-lint.log`, `tmp/hotfix-unit.log`, `tmp/hotfix-browser.log`,
and `playwright-report/admissions-v2/`. Existing non-failing Next workspace-root,
Sentry/OpenTelemetry dynamic-dependency, Edge API and tool deprecation warnings
remain outside this hotfix's scope. The isolated cluster was stopped after tests;
its synthetic data and diagnostics remain available in ignored `tmp/`.

The initial pre-hydration test expected a disabled rendered button; Next's
Suspense placeholder renders no form at all before hydration in development.
The assertion was corrected to accept the loading placeholder or disabled button
and require zero enabled admissions submit buttons.

The first full production-mode run exposed a local fixture setup error: Windows
initdb defaulted to WIN1252 and PostgreSQL rejected the existing Tamil student
notification text. That synthetic database was preserved as
`admissions_hotfix_win1252_debug`; the guarded test database was reprovisioned
with UTF-8 using template0. No application or translation changes were made for
this environment issue.

## Exact files changed

1. `components/admissions/AdmissionsEnquiryForm.tsx`
2. `lib/validation/admissions-enquiry.ts`
3. `lib/admission/enquiries.ts`
4. `tests/admissions-v2.test.ts`
5. `e2e/admissions-v2.spec.ts`
6. `reports/admissions-v2-university-selection-hotfix.md`

No multilingual, exam engine, schema, migration, dependency or unrelated UI files
are part of the hotfix. Existing multilingual changes and all other worktrees
are preserved. Local generated logs, database and browser artifacts are ignored.

## Deployment instructions (release operator only; not executed)

1. Review the local hotfix commit and the six-file diff against the base above.
   Re-fetch main and revalidate if it advances. Push/create a PR only after
   separate authorization; this task stops before push or merge.
2. Run `npm run typecheck`, `npm run lint`,
   `npx vitest run tests/admission.test.ts tests/admissions-v2.test.ts`, and
   `npm run build`. Provision only the guarded disposable admissions DB and run
   `npx playwright test --config playwright.admissions.config.ts` against the
   built local server. Existing CI provisions this same isolated DB automatically.
   For a manual local run, set both `DATABASE_URL` and `DIRECT_URL` to the disposable
   `127.0.0.1:55441/admissions_v2_isolated` database, use a test-only `JWT_SECRET`,
   and start `npm run start -- -p 3107 -H 127.0.0.1` in another terminal. With
   `CI=1`, the Playwright config starts/stops that server itself. Never point
   Prisma schema setup or these browser tests at a production database.
3. After approved PR review and merge, deploy through the normal release pipeline.
   This fix requires no database migration. Deploy client and API together; old
   tabs submitting a catalogue name without an ID receive validation failure and
   must refresh/reselect. Do not create real or synthetic production enquiries
   as a smoke test. Check selection, navigation and read-only release logs instead.

## Rollback instructions (not executed)

Restore the deployment for `275107a92641fc274e6a1434d24c92b24a611e37`, or revert
the hotfix commit in a reviewed follow-up release. No schema/data rollback is
needed; inbox messages containing University ID remain readable by the previous
application. That baseline has the confirmed stale-selection defect, so prevent
university-specific enquiry submission while investigating a rollback. Do not
rewrite or delete existing student enquiries. A rollback is a separate authorized
production operation.

## Release boundary

Local candidate only. No push, PR, merge, production deployment, production
database write, real enquiry or multilingual modification was performed.
