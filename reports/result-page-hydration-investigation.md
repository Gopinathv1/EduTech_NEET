# Targeted result-page hydration investigation

Date: 2026-10-08 (Asia/Kolkata). Checkout: `cedd9514325e080ad6790a636bf3859af5ac4447`.

## Outcome

The historical intermittent defect has not been reproduced in the bounded checks recorded below. No exact root cause has been established, and no application fix has been made. A clean bounded run does not establish that the historical defect is resolved; the intermittent risk remains under observation.

The previous evidence came from the isolated staging NEET Full Mock lifecycle, with React #418 followed by repeated `parentNode` errors. React documents [#418 as a server/client hydration mismatch](https://react.dev/errors/418). The available historical capture contains error messages but no component mismatch diff or runtime stack establishing which component caused it. The relationship between the two historical errors remains unproven.

## Rendering-path findings

- The result route authenticates and loads the persisted report/review on the server. Submitted dates and attempt-history dates are formatted on the server; the client does not independently recompute them.
- Result analysis is a server component using persisted scores and deterministic CSS bars, not a browser-sized chart. No random IDs or clock-dependent client render were found in the result components.
- `ResultTabs` starts on Analysis and mounts both panels with stable wrappers. `AnswerReview` initially uses its locale prop; saved question language is read in an effect after the initial render. Storage does not select a different initial SSR tree.
- The route loading skeleton is structural server markup. The independent `MonitoringSummary` Suspense boundary has a null fallback and returns read-only server markup or null. No invalid HTML nesting was identified in these paths.
- The header receives server-derived session, locale, notification, and accessibility data. Its notification dropdown starts closed; relative notification times are not rendered in its initial tree.
- Shared navigation uses server session props and pathname. Chat/dropdown overlays initially remain closed. No portal, `parentNode`, child removal, or HTML replacement was found in the inspected result/shared-control rendering path. Peacock background effects change a body class, not the result DOM structure.
- Free retake availability is server-derived. No payment checkout component is mounted on the result page in free-exam mode.

These findings explain why common nondeterministic first-render causes were not observed; they do not identify the historical cause. The result route and answer-review source match the corresponding current sanity worktree files, so there is no evidence of an intervening result-specific fix.

## Isolated browser checks

Only localhost staging was used: `127.0.0.1:5433/sivora_sanity_staging`, with both database URLs checked before runtime/database access. No production access was used. The existing disposable fixture student was reused; no new question, translation, or test definition was created.

| Check | NEET Full Mock | JEE Main Full Mock |
|---|---|---|
| Fresh normal attempt submitted | 1 | 1 |
| Expected/persisted/displayed score | 3 / 720 | 8 / 300 |
| Correct / wrong / skipped | 1 / 1 / 178 | 2 / 0 / 73 |
| Attempted / total | 2 / 180 | 2 / 75 |
| Answer review | Correct and wrong MCQ identities retained | Correct MCQ plus numerical response/answer `12` |
| Subject/chapter/time analysis | PASS | PASS |
| Development result reloads | 2 | 2 |
| Review language EN/TA/HI | PASS | PASS |
| Monitoring summary vs stored count | 0 / 0 | 0 / 0 |

Tamil and Hindi question preferences were exercised across the submission/result boundary and reloads. These staging Full Mocks have no approved Tamil/Hindi wording for the sampled questions: the checks verify their expected English fallback, notice, option/answer binding, and language controls. They do not repeat the earlier live proof-translation certification. NEET also passed Tamil and Hindi interface locale changes, including the server-formatted date and a Tamil reload.

One unrelated development console warning concerned Next.js's future handling of CSS smooth scrolling. It was not a hydration/runtime error and was left unchanged.

A fresh local production build of this checkout completed successfully, including compilation and type checking. The two existing submitted attempts were then checked in production mode: direct result loads and client navigation back from each retake entry produced four result views in total. Scores, counts, analysis, answer review, and language controls remained correct. Both free retake entries displayed an enabled Start Test action without a payment prompt; no additional attempts were started. No hydration errors, `parentNode` errors, other runtime errors, or console warnings were observed in production mode. Monitoring summaries remained consistent with the zero stored events; no monitoring events were deliberately injected.

## Focused automated tests

Command:

```text
npx vitest run tests/attempt-result.test.ts tests/analysis.test.ts tests/attempt-history-action.test.ts tests/question-translations.test.ts tests/attempt-monitoring.service.test.ts tests/payment-routes.test.ts
```

Result: **6 files, 71 tests PASS**. No complete-site audit or unrelated browser suite was run.

## Protected scope and cleanup

A read-only staging reconciliation compared all 255 captured canonical English records used by these two Full Mocks with their pre-run fixture snapshots: all unchanged. The fixture has zero payment records. No scoring rules, datasets, canonical questions/answers, translations/approval states, existing monitoring records, migrations, or application files were edited.

The temporary reproduction-only `tmp/result-hydration-investigation/local-runtime.cjs` was removed, and its owned localhost server was stopped. Other temporary investigation evidence and the pre-existing sanity worktree were preserved. No deployment, push, or merge was performed.
