# SIVORA UP↑RISING full-site sanity review

Date: 2026-10-07  
Branch: `codex/full-site-sanity-review`  
Audit starting point: `03674be7395d81496f3151c4dbd90100a6b4e902`  
Continuation baseline: `cab7d2aba6cde3c1687bea168938b3ef84d0cdaf`

No deployment, merge, production write, or canonical dataset modification was performed. Production reconciliation used an enforced read-only transaction and aggregate/hash evidence only. The original multilingual working checkout was preserved.

## NEET REPRESENTATIVE VERIFICATION

Production reconciliation found **780 released NEET questions**. All 780 expected released records were found, and the collected text/options hashes matched the checked-in release artifacts; all were active, approved, and published.

On isolated local staging seeded from repository release artifacts, **11 NEET journeys** were exercised: Full Mock, 2021–2025 PYQ, Mixed, Subject-wise, Chapter-wise, Conceptual nature, and Numerical/problem-solving nature. Non-full modes used three representative questions each; the Full Mock used four subject representatives. Across NEET and JEE, the exact sample was **22 journeys and 70 question instances**. The exercised checks covered rendering, complete text, options/numerical input, answer entry, navigation, timer movement, refresh/resume, submit, score/result/review, retake, and monitoring transport failure isolation. This is representative functional testing; it is not a manual review of every question.

## JEE REPRESENTATIVE VERIFICATION

Production reconciliation found **218 released JEE questions**. All 218 expected released records were found, and the collected text/options hashes matched the checked-in release artifacts; all were active, approved, and published.

On isolated local staging, **11 JEE journeys** were exercised: Full Mock, 2021–2025 PYQ, Mixed, Subject-wise, Chapter-wise, Conceptual nature, and Numerical/problem-solving nature. The JEE Full Mock sample included both MCQ and NUMERICAL_VALUE representatives. MCQ selection and numerical entry were exercised. No claim is made that every released JEE question was manually reviewed.

## FULL MOCK VERIFICATION

Production aggregate evidence recorded:

| Exam | Questions | Duration | Max marks | Price/state | Scoring | Distribution |
|---|---:|---:|---:|---|---|---|
| NEET Full Mock | 180 | 180 min | 720 | Free; published | +4 / −1 / 0; free unlimited retakes | Physics 45, Chemistry 45, Botany 48, Zoology 42 |
| JEE Full Mock | 75 | 180 min | 300 | Free; published | +4 / −1 / 0; free unlimited retakes | Each of Physics, Chemistry, Mathematics: 20 MCQ + 5 NUMERICAL_VALUE |

The staging Full Mock journeys additionally checked question count, duration, free/published state, score calculation, result/review, and retake behavior.

## AUTH

Completed on isolated staging:

- registration request and local fixture OTP verification;
- password login, logout, protected-route redirect, and student-to-admin denial;
- password-reset token lifecycle and one-time-use behavior;
- incomplete-profile redirect and completion;
- student and partner profile save checks;
- admin search, clear, and CSV export.

The registration delivery boundary returned the expected provider-unavailable response in the local environment; no email was sent and no credentials or tokens were exposed. Real email delivery, real Google account sign-in, and real password-reset delivery remain **EXTERNAL_VERIFICATION_REQUIRED**. Any other provider-backed delivery flow not exercised remains external verification work.

The live site was checked read-only at `https://www.sivora-uprising.com/`: 20 GET/browser checks returned successful responses, `/api/health` returned HTTP 200 with `ok`, and `/api/auth/providers` reported the configured `google` provider. This does not establish a real Google account session.

## PAYMENTS

The released exam catalog is free. Exam payments are disabled, so exam payment is **NOT APPLICABLE TO CURRENT FREE EXAM RELEASE** and is not treated as a production blocker. The legacy free-exam order endpoint now rejects a zero-price test without creating a payment or contacting the gateway; the paid-retry endpoint remains disabled. No real charge was created. Future paid checkout and provider confirmation were not tested.

## FLOATING CONTROLS

The global Home/back/forward/logout controls, WhatsApp launcher, and AI launcher were moved into a reserved bottom dock; page content and focus targets reserve the dock height, and the active exam route keeps its own action area. Desktop/mobile contact, registration, and forgot-password checks confirmed the controls did not obscure the tested submit targets. The AI panel remains an explicit user-opened overlay.

## CONTACT/LEGAL

The contact page no longer shows the stale placeholder phone or legacy support email. It displays the configured WhatsApp number/link (`+919750837020`) plus the existing address and hours. Terms now describe NEET and JEE Main preparation and account credentials accurately. No unverified email address or phone number was invented.

## LOCALIZATION

Existing sanity checks exercised the locale selector and Hindi/Tamil cookie/HTML-language behavior. Coverage remains partial: this review did not certify every translated public, student, partner, admin, form, or error string, and released question translations were not expanded. No claim of complete localization is made.

## REMAINING P0

None observed in the collected scope.

## REMAINING P1

None observed in the collected scope.

## REMAINING P2

One intermittent result-page React hydration defect remains known. During the representative staging run, after navigation to `/student/results/<attemptId>`, Playwright recorded one `Minified React error #418` message (`HTML`) followed by repeated `Cannot read properties of null (reading 'parentNode')` page errors. The first capture recorded 10 repeated `parentNode` entries; a later combined run recorded 14. The functional result assertions had already completed, but the run was not clean. This issue was not investigated further in accordance with the stop instruction.

## TESTS

- TYPECHECK: passed.
- LINT: passed with no ESLint warnings/errors.
- BUILD: passed; 142 pages prerendered.
- UNIT/INTEGRATION: **572 passed, 3 skipped**.
- BROWSER TESTS: the existing 14 sanity browser regressions passed. The representative suite exercised 22 staging journeys; the collected run was functionally exercised but not clean because of the known intermittent result-page hydration error above. Auth/control/free-payment/profile/CSV checks completed successfully, except the later navigation assertion used the prior control labels and timed out before any application behavior was evaluated.

## APPLICATION CHANGES ALREADY MADE ON THIS BRANCH

- Added `components/navigation/QuickControls.tsx` and integrated a reserved bottom dock in `app/layout.tsx`.
- Repositioned `GlobalNavigationControls`, `WhatsAppFloatingButton`, and `AIChatButton` so their controls do not float over page content; adjusted the AI panel placement.
- Added global bottom scroll/focus padding in `app/globals.css`.
- Corrected public contact details in `app/(public)/contact/page.tsx` to use the configured WhatsApp contact and removed the stale email/placeholder phone.
- Corrected outdated product/legal wording in `app/(public)/terms/page.tsx`.
- Added a zero-price guard to `app/api/payments/create-order/route.ts` so free releases cannot create legacy payment orders.
- Normalized Indian mobile display with `formatIndianMobile` in the admin student, payment, report, and lead-detail views to avoid duplicated `+91` prefixes.

Audit fixtures, route inventories, browser collectors, representative E2E specs, payment tests, and read-only live-check reports were also added or updated to document this verification. They use isolated local staging guards; they do not alter canonical datasets or production.

## FINAL VERDICT

**PRODUCTION READY WITH ONE KNOWN TECHNICAL ISSUE**

This verdict is limited to the evidence collected in this stopped review: production released-question reconciliation plus representative staging functional testing, the completed regression/unit/type/lint/build checks, and the listed auth/control checks. The exact remaining technical issue is the intermittent result-page hydration error above. Real provider-backed email, Google OAuth, and password-reset delivery remain external verification requirements.

No deployment or merge was performed.
