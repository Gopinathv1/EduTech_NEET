# NEET implementation and verification report

Review date: 18 September 2026. Continued the existing implementation without restarting it. No commit, push, deployment, schema change, or production seed was performed by this work.

1. **Existing architecture reused.** Next.js App Router, Prisma/PostgreSQL, existing student sessions, Test/TestAttempt/Answer/Result models, generator, attempt APIs, server report builders, next-intl, and existing exam/result components. Non-full test formats retain their own question counts and durations. Payment integration was not redesigned.

2. **Official NEET 2026 configuration.** Central `NEET_CONFIG`: 180 compulsory single-correct MCQs, four options, 180 minutes, 720 maximum marks; +4 correct, −1 incorrect, 0 unanswered. Official allocations: Physics 45, Chemistry 45, Biology 90. SIVORA groups Biology into Botany 45 and Zoology 45 for practice. Full-mock creation/generation validates the configuration and reviewed question coverage. Online practice is distinct from the official paper/OMR examination.

3. **Official source.** [NTA NEET (UG) 2026 Information Bulletin](https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/02/202602231394640855.pdf), chapter 4, printed pages 21–22 (PDF pages 25–26), reached through the [NTA admission bulletin page](https://neet.nta.nic.in/admission-bulletin/). Verified on 17 September 2026. The 45/45 Biology subdivision is explicitly described as SIVORA's convention.

4. **Exact changed files.** The complete tracked implementation manifest, relative to the original pre-work baseline `165b83c`, appears below. Earlier completed work is already present in the user's current `ba3e290` checkout; this continuation did not create that commit. Generated evidence and this report are listed separately.

5. **Three free attempts.** The backend counts attempts per student and per test. Catalogue/detail/instructions visits consume zero. Only successful creation of a complete persisted attempt consumes one. An active attempt resumes without consuming another. Three completed starts are allowed; a fourth is blocked by both UI and API. Logout/login preserves the count. Another test and another user each receive independent quotas. No payment request occurred during the browser journey.

6. **Concurrency protection.** A serializable transaction rechecks active attempt and quota, creates the frozen session, and retries serialization conflicts. Real PostgreSQL verification used six concurrent starts at each of three stages: each group returned one shared session. Duplicate finalization created one result. Answer writes and finalization coordinate through the attempt row so a submitted/expired session cannot be modified. Expected transaction-conflict logs during the race test were successfully retried.

7. **Subject navigation.** Physics, Chemistry, Botany and Zoology jump to their respective questions and preserve answers. Both the generator and database fixture were checked for 45 questions in each group, 180 total. Saved selections survived subject changes and refresh.

8. **Question palette.** All five states were exercised: not visited, visited/unanswered, answered, marked/unanswered, answered-and-marked. State labels, distinct symbols and accessible names supplement colors. Selection, clear, mark/next, save/next, palette jump and refresh were checked. The number grid scrolls independently so the legend remains reachable beside 180 questions.

9. **Timer and expiry.** Remaining time derives from server start time plus duration. The client display uses a monotonic clock anchored to server remaining time, with periodic sync. A browser date change to 2035 and reload did not increase remaining time. Expired answers returned 409; expired attempts finalized as AUTO_SUBMITTED. Both API-triggered expiry and the real standalone worker were exercised. Duplicate submit was idempotent. `npm run attempts:expire` runs the worker continuously; `-- --once` runs a single sweep. Production supervision remains a deployment task.

10. **Scoring.** Final scoring runs on the server using stored answers and answer keys. The browser fixture deliberately produced four correct answers, one wrong and 175 blank: 4×4−1 = **15/720**, attempted 5, accuracy **80%**. Physics scored 8; Chemistry −1; Botany 4; Zoology 4. Marked-but-answered questions are scored normally; marked blanks remain unanswered. Answer keys and explanations are absent from the active exam payload.

11. **Results and analysis.** Results show server score, correct/wrong/unanswered counts, accuracy, elapsed time, subject and chapter analyses, and stored answer explanations. Subject rows expose attempted/correct/wrong/skipped/marks/accuracy. Overall elapsed time comes from server submission minus start time, capped to duration; per-question/subject engagement time is client-reported and is not used for scoring. Fabricated rank/percentile placeholders were removed. Hindi is preserved by the report language mapping. Missing explanations are not invented.

12. **Attempt history.** Test detail and result pages show persisted attempts and remaining/used quota. The browser exercised retry links for attempts 2 and 3, then verified 3/3 used and removal of the retry link. Opening old results does not create another attempt.

13. **Navigation issue and exact fix.** Login reached the student dashboard, whose shared header lacked an Exam Preparation link; this prevented the requested direct click journey. Added a localized `/exam-preparation` link to `StudentHeader` and wrapping navigation for narrow widths. The test now clicks the complete route: login → dashboard → Exam Preparation → NEET → Full Mock catalogue → detail → instructions → exam. Protected deep links still redirect to login with their exact safe callback. Separate test-selector issues were corrected by targeting the visible NEET card and allowing the decorative arrow in the Full Mock link; no application transition is bypassed in this journey.

14. **Desktop browser results.** Chromium at 1440px passed actual navigation, every answer action, all five palette states, all four subjects, reload persistence, timer tampering, confirmation cancel/submit, server scoring, review, history, three starts, fourth rejection, independent quotas and worker expiry. No uncaught page errors or payment requests were recorded. Additional tablet coverage used 768px.

15. **Mobile browser results.** 360px, 390px and 430px were checked at 844px height. Questions/options remained readable, option hit areas were 62px high, timer and submit remained visible, subject controls and expandable palette worked, palette jumps persisted, and submission dialogs opened and cancelled successfully at every tested width. No document horizontal overflow was detected. The development-only Next badge was disabled because it covered an action at narrow widths. The subject analysis table intentionally scrolls horizontally within its container so all columns remain accessible.

16. **Automated test results.** `npm test -- --reporter=dot`: **40 files, 253 tests passed**. Real isolated PostgreSQL concurrency/quota/expiry script: **PASS**. Full NEET Playwright journey: **PASS**; expanded timing and mobile-dialog assertions also **PASS**. Displayed elapsed time matched the server timestamps at **34 seconds**. Mobile result pages had no document overflow. Synthetic fixture content is clearly labelled local UI test data, not a real NEET question bank.

17. **Lint.** `npm run lint`: **PASS**, no ESLint warnings/errors. Next emitted non-failing notices about future lint-command deprecation and workspace lockfile inference.

18. **Typecheck.** `npm run typecheck`: **PASS**.

19. **Build.** Final `npm run build`: **PASS (exit 0)**; 124/124 static pages generated and route optimization completed. It uses both database environment variables pointed at isolated localhost PostgreSQL; the migration-running `vercel-build` command is not used.

20. **Remaining limitations / operational TODOs.** Run/supervise the expiry worker when deploying; no worker service, deployment or scheduler was provisioned. The worker currently scans in-progress attempts and may need batching/index tuning at larger scale. Production question-bank coverage and reviewed translations require editorial verification; this run used 180 synthetic English questions. English/Tamil/Hindi UI strings are implemented, but the complete browser journey was exercised in English. The model supports a single correct key, not special NTA dropped-question/multiple-accepted-key adjudication. Server times are authoritative; per-question engagement timing is advisory. No external real-device/browser matrix was run beyond local Chromium viewport tests. Existing build warnings include workspace lockfile inference, Sentry/OpenTelemetry dynamic dependency imports, and jose compression APIs in the Edge bundle; the build still exited successfully. External fetches also logged `UNABLE_TO_VERIFY_LEAF_SIGNATURE` certificate errors during static generation; no TLS checks were disabled. These non-fatal environment/dependency diagnostics remain outside the NEET implementation scope.

**Database safety record.** This continuation guarded both DATABASE_URL and DIRECT_URL as `127.0.0.1:55432` and operated on the isolated database only. No production/student records were edited or deleted. In the earlier implementation session, a migration-status/deploy command inadvertently used the existing Neon DIRECT_URL while only DATABASE_URL had been overridden; it returned “No pending migrations to apply” and applied no migrations. This was disclosed when discovered. Both variables were subsequently overridden for all database validation. No production migration or seed is part of this continuation.

## Complete implementation file manifest

- [app/(public)/exam-preparation/neet/page.tsx](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/app/(public)/exam-preparation/neet/page.tsx)
- [app/(student)/student/results/[attemptId]/page.tsx](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/app/(student)/student/results/[attemptId]/page.tsx)
- [app/(student)/student/tests/[id]/page.tsx](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/app/(student)/student/tests/[id]/page.tsx)
- [app/(student)/student/tests/[id]/start/page.tsx](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/app/(student)/student/tests/[id]/start/page.tsx)
- [app/api/attempts/[id]/answer/route.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/app/api/attempts/[id]/answer/route.ts)
- [app/api/attempts/[id]/language/route.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/app/api/attempts/[id]/language/route.ts)
- [app/api/attempts/[id]/sync/route.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/app/api/attempts/[id]/sync/route.ts)
- [components/admin/TestForm.tsx](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/components/admin/TestForm.tsx)
- [components/student/StudentHeader.tsx](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/components/student/StudentHeader.tsx)
- [components/student/exam/AttemptHistory.tsx](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/components/student/exam/AttemptHistory.tsx)
- [components/student/exam/ExamClient.tsx](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/components/student/exam/ExamClient.tsx)
- [components/student/exam/QuestionPalette.tsx](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/components/student/exam/QuestionPalette.tsx)
- [components/student/exam/StartAttemptClient.tsx](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/components/student/exam/StartAttemptClient.tsx)
- [components/student/exam/SubmitDialog.tsx](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/components/student/exam/SubmitDialog.tsx)
- [components/student/results/AnswerReview.tsx](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/components/student/results/AnswerReview.tsx)
- [components/student/results/ResultAnalysis.tsx](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/components/student/results/ResultAnalysis.tsx)
- [components/student/results/localize.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/components/student/results/localize.ts)
- [lib/admin/format.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/lib/admin/format.ts)
- [lib/admin/test-build.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/lib/admin/test-build.ts)
- [lib/attempts/config.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/lib/attempts/config.ts)
- [lib/attempts/examState.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/lib/attempts/examState.ts)
- [lib/attempts/expiry.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/lib/attempts/expiry.ts)
- [lib/attempts/result.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/lib/attempts/result.ts)
- [lib/attempts/service.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/lib/attempts/service.ts)
- [lib/attempts/timer.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/lib/attempts/timer.ts)
- [lib/generator/index.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/lib/generator/index.ts)
- [lib/generator/plan.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/lib/generator/plan.ts)
- [lib/recommendations/types.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/lib/recommendations/types.ts)
- [lib/reports/answer-review.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/lib/reports/answer-review.ts)
- [lib/reports/result-report.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/lib/reports/result-report.ts)
- [lib/validation/attempt.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/lib/validation/attempt.ts)
- [messages/en.json](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/messages/en.json)
- [messages/hi.json](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/messages/hi.json)
- [messages/ta.json](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/messages/ta.json)
- [next.config.mjs](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/next.config.mjs)
- [package.json](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/package.json)
- [scripts/expire-attempts.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/scripts/expire-attempts.ts)
- [scripts/verify-neet-browser.cjs](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/scripts/verify-neet-browser.cjs)
- [scripts/verify-neet-local.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/scripts/verify-neet-local.ts)
- [tests/attempt-answer.route.test.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/tests/attempt-answer.route.test.ts)
- [tests/attempt-expiry.test.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/tests/attempt-expiry.test.ts)
- [tests/attempt-start.route.test.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/tests/attempt-start.route.test.ts)
- [tests/attempt-start.service.test.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/tests/attempt-start.service.test.ts)
- [tests/attempt-timer.test.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/tests/attempt-timer.test.ts)
- [tests/exam-state.test.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/tests/exam-state.test.ts)
- [tests/neet-config.test.ts](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/tests/neet-config.test.ts)

Additional deliverable: `NEET_IMPLEMENTATION_REVIEW.md` (this report).

## Local evidence and review

- [Browser evidence JSON](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/test-results/neet-browser-report.json)
- [Desktop palette](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/test-results/neet-palette-desktop.png)
- [360px exam](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/test-results/neet-360.png)
- [390px exam](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/test-results/neet-390.png)
- [430px exam](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/test-results/neet-430.png)
- [Result screenshot](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/test-results/neet-result.png)
- [Local review fixture credentials](C:/Users/gopis/Neet_EDU_TECH/EduTech_NEET/test-results/neet-fixture.json)

Evidence and local database files live in ignored `test-results/`; they are not production data or committed artifacts. Local preview: [student login](http://localhost:3100/login). Use the fixture credentials, then choose its test ID from the catalogue. The dedicated fixture review student retains three unused attempts.
