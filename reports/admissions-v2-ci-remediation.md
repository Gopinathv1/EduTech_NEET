# Admissions V2 CI remediation

Reviewed 2026-10-08. PR: https://github.com/Gopinathv1/EduTech_NEET/pull/2. Branch: `codex/admissions-v2-integration-gate`.

## Exact original failure

PR run `37775367580`, job `e2e` (`113305572410`), step 14 `Run E2E happy path` failed with exit code 1 during Playwright collection. The push run `37775267105` failed in the same step. The `quality` jobs passed lint, typecheck, unit/integration tests and production build.

Collection errors:

- `admissions-v2.spec.ts:7`: `Error: Isolated Admissions database required` — suite expects `127.0.0.1:55441/admissions_v2_isolated`, while the generic CI job provisions `localhost:5432/neet_test`.
- `full-site-sanity.spec.ts:10`: `ENOENT ... tmp/sanity-fixtures.json` — a separately prepared local staging fixture is not in CI or Git.
- `production-blocker-controls.spec.ts:9`: `Isolated staging required` and `production-blockers.spec.ts:9`: `Isolated released staging required` — these are guarded localhost:5433 staging suites, not the generic disposable CI suite.

Classification: **workflow/test-environment selection configuration defect**, not a network failure or evidence of an exam/scoring defect. The safety guards correctly prevented execution in the wrong environment. Constraint errors in container logs belong to intentionally negative migration-probe checks; their workflow steps passed.

## Fix

The default Playwright config selects the general CI suites without importing separately provisioned Admissions/local-staging suites. The sanity config explicitly retains all three local staging suites. The workflow adds a dedicated Admissions E2E job with its own disposable PostgreSQL service at the exact guarded hostname/port/database and a managed production-mode server on port 3107. All 12 desktop/mobile Admissions tests run there; none are skipped or weakened. Existing migration probes continue to run only in disposable CI and no production/schema migration is added.

The general happy-path counselling section was stale: it attempted a country checkbox that is now a button and omitted required category, budget and parent-contact inputs. It now completes the current form and verifies the actual success heading, tracking view, persisted score and consent timestamp.

A CI-equivalent local run also reproduced **a real pre-hydration interaction race**: the category selection was lost while React initialized, leaving validation empty. The student counselling fieldset and the historically affected admin status select now remain disabled until handlers are mounted. The Admissions submission test now requires the exact success heading/link rather than accidentally matching a header navigation link. No retry, timeout, validation, consent or authorization assertion was relaxed.

## Local evidence before push

- Typecheck and lint passed.
- Seven focused unit files: 78 passed, covering admissions, exam state, student exam presentation and multilingual V1 translation behaviour.
- Fresh production build passed after the hydration fix.
- New CI-managed production-server path: all 12 Admissions browser tests passed, 45.5 seconds (six desktop, six mobile).
- Default CI collection with `localhost:5432/neet_test`: 13 tests in five intended files; no wrong-database or missing-local-fixture import failures.
- Workflow YAML parsed; dedicated service port, database URLs and browser command verified.
- `git diff --check` passed. Runtime exam-engine, translation resources, migrations and multilingual V2 branches remain untouched.

Generated logs and GitHub job captures are in ignored `tmp/`. Local browser writes used only the existing isolated Admissions database; no production data, real communications, main merge or manual deployment. GitHub CI results must be checked on the new pushed head before declaring merge readiness. No assertion is treated as passed merely because collection succeeds.
