# JEE Main 2021–2025 V1 production gate

Ready for exact production data authorization; no production writes have been performed.

Release manifest SHA256: `1fdd7f03266ef2cdc8a0b9a9d1523821913996b47cc49d427cd43fe394dbc63e`.

```text
QUESTIONS TO IMPORT: 218
QUESTIONS TO APPROVE: 218
QUESTION VERSION RECORDS: 654
AUDIT LOG RECORDS: 1108
PRACTICE TESTS TO CREATE: 227
TAXONOMY WRITES: 0
MIGRATIONS: 0
UNRELATED RECORDS MODIFIED: 0
```

Question records include 136 MCQs and 82 numerical-value questions. Each question creates one import version/audit, one review-submission version/audit and one approval version/audit: 654 QuestionVersions and 654 question AuditLogs. Each new practice creates one creation audit and one publication audit: 454 practice AuditLogs, bringing the total to 1108. Practice includes 5 partial historical shifts, 5 distinct year aggregates, 1 mixed set, 18 subject plans and 198 populated chapter plans. The 10 fixed shift/year plans also create 436 associated TestQuestion membership rows. All plans are free with unlimited retries; no notifications or payment records are created by this release workflow.

All three final dry-runs use the above release hash, identify the same production project/database through both URLs and require a non-pooled direct URL. Existing selected JEE question rows and planned test rows: zero. Exact canonical subjects/chapters exist, with no conflicts and exactly one active SUPER_ADMIN. Import uses nine controlled batches of at most 25 questions. Every importer and approval command verifies complete content, lifecycle/version/audit history and the release hash when resuming. Practice refuses conflicting IDs/rules/membership.

Local verification: 448 repository tests passed, 3 skipped; 45 focused JEE tests passed; typecheck, lint, git diff whitespace checks and the local production build passed. The build emits dependency warnings from Sentry/OpenTelemetry and the existing multiple-lockfile workspace setup. No E2E run against the production database, deployment or live JEE attempt validation has been performed before authorization.

The protected production fingerprint comparison is unchanged: 780 NEET PYQs, 278 NEET practices, 200 local NEET quarantined records, NEET nature distribution 629 conceptual / 151 numerical, both Full Mocks and both sample tests. Protected row fingerprints include all question fields, nature, translations, updated timestamps, test definitions and fixed membership. No NEET artifact is modified.

Canonical artifacts: [release manifest](../data/previous-year/jee/release-manifest.json), [classification report](../data/previous-year/jee/classification-report.json), [quarantine report](../data/previous-year/jee/quarantine-report.json), [taxonomy gaps](../data/previous-year/jee/taxonomy-gap-report.json), and [coverage checkpoint](jee-v1-coverage-checkpoint.md).

The full 117-shift / 136-variant acquisition and official-key manifests are preserved. Only five shifts were reviewed. Temporary PDFs, rendered evidence, extraction helpers and dry-run fingerprints remain in `tmp/`; none belongs in the commit.

After explicit authorization, verify this release hash and protected baseline again, then use the guarded import, approval and practice commands in that order. Each requires `--execute`, its exact action confirmation and `JEE_HISTORICAL_RELEASE_SHA256`. Re-run dry-runs and protected-baseline comparison afterward. Import readiness is a technical preflight status and does not grant production write permission.
