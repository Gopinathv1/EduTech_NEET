# NEET Smart Practice & Admission Assistance Platform

This file gives Claude Code (and any developer) the full, durable context for the
project. Read it before making changes.

## Project overview

A cloud-based, mobile-first web platform with two business goals:

1. **Sell affordable NEET mock tests** to students at **₹30 per test** — previous
   year pattern tests, chapter-wise practice, and year-wise practice.
   Target users: Government School students, Tamil Nadu State Board students,
   rural students, and repeat NEET candidates.
2. **Generate qualified student leads** for an educational admission consultancy
   that helps students get medical admissions abroad (Russia, Georgia,
   Kazakhstan, Kyrgyzstan, Uzbekistan, Philippines, and other approved
   destinations).

## User roles

- **Student** — register, login, purchase tests, attend tests, view results,
  download reports, contact consultancy.
- **Admin** — upload questions, manage question bank, view payments, view
  students, create mock tests, publish notifications, view reports, export
  student data.
- **Super Admin** — manage admins, dashboard analytics, financial reports, user
  management, access logs, system configuration.

## Modules (built phase by phase)

- Public company website
- Student registration with OTP
- Login
- Student dashboard
- Mock test catalogue with filters
- ₹30 payment via Razorpay
- Test engine with timer and autosave
- Question bank management
- Random question generator with NEET subject/chapter weightage
  (Physics, Chemistry, Botany, Zoology)
- Result page with chapter / subject / time analysis
- Performance analytics
- Admission consultancy lead form
- Notifications
- Admin and Super Admin dashboards with reports

## Non-functional requirements

- **Multilingual:** English and Tamil live; Hindi scaffolded-but-disabled
  (`messages/hi.json`); Telugu/Kannada/Malayalam later. Adding a language
  requires **only** a new `messages/<code>.json` plus a code + name + flag in
  `i18n/config.ts` — see "Internationalization, accessibility & help".
- **Mobile-first** and **low-bandwidth friendly** for rural internet (charts
  code-split, route skeletons, resilient exam autosave).
- **Accessible:** large-font mode, high-contrast mode, skip-to-content,
  keyboard-navigable with labelled controls (see the a11y section).
- **Fast:** page loads under 2 seconds.

## Tech stack

- **Framework:** Next.js 15 (App Router) with TypeScript.
- **Styling:** Tailwind CSS v3 (`tailwind.config.ts`), mobile-first.
- **i18n:** next-intl (cookie-based locale, no URL prefix).
- **ORM / DB:** Prisma ORM + PostgreSQL.
- **Payments:** Razorpay.
- **OTP:** external SMS/OTP provider.
- **Auth:** JWT-based (secret in `JWT_SECRET`).

## Folder structure

```
app/
  (public)/        # public marketing site + home page (resolves to /)
  (student)/       # student area (e.g. /student/dashboard)
  (admin)/         # admin + super-admin area (e.g. /admin/dashboard)
  api/             # route handlers (e.g. /api/health)
  layout.tsx       # root layout, wraps app in NextIntlClientProvider
  globals.css      # Tailwind entry + base styles
components/         # shared React components (e.g. LanguageSwitcher)
lib/               # server/client utilities (prisma client, locale cookie)
  (auth)/          # login, register, forgot-password (own AuthShell, no public chrome)
  (admin)/admin/(portal)/  # authenticated admin portal (sidebar layout)
components/
  public/          # marketing UI: header, footer, ui primitives, icons, forms
  auth/            # auth forms + hooks
  admin/           # admin portal UI (nav, question bank, chapters, bulk)
  ui/              # shared form primitives
i18n/              # next-intl config (config.ts) + request.ts
messages/          # en.json, ta.json — one file per language
lib/public/        # nav links, country codes, site constants
lib/admin/         # admin nav, CSV bulk validation, test-build, formatting
lib/generator/     # pure random question generator + rng + DB planner
lib/student/       # student catalogue coverage helpers
lib/payments/      # razorpay (orders/signatures), finalize service, invoice PDF
lib/storage/       # pluggable file storage (local dev → S3 later)
public/            # hero.svg, og.svg (local assets); uploads/ (gitignored)
prisma/            # schema.prisma
middleware.ts      # Edge route protection (auth) — see the Auth section
tests/             # vitest unit + API-route tests
```

Note: route groups `(public)`, `(auth)`, `(student)`, `(admin)` do not add URL
segments, so only one group may own the `/` route (currently `(public)`); the
others use named sub-routes such as `/student/dashboard` and `/admin/dashboard`.
Auth pages live in `(auth)` (not `(public)`) so the marketing header/footer don't
wrap the full-screen auth cards.

## Coding conventions

- **TypeScript strict mode** is on — no implicit `any`, handle nullability.
- **Server Components by default.** Add `'use client'` only when a component
  needs state, effects, or browser-only APIs (e.g. `LanguageSwitcher`).
- **All user-facing strings go through i18n.** Never hard-code display text in
  components — add keys to `messages/en.json` and `messages/ta.json` and read
  them with `useTranslations` / `getTranslations`. Keep both locale files in
  sync (same key structure).
- **Mobile-first Tailwind.** Write base (smallest-screen) utilities first, then
  layer `sm:` / `md:` / `lg:` overrides.
- **Prisma access** goes through the singleton in `lib/prisma.ts` (never
  instantiate `PrismaClient` directly).
- **Secrets** live in `.env` (never committed). Keep `.env.example` up to date
  when adding new environment variables.

## Database

PostgreSQL via Prisma. Schema: `prisma/schema.prisma`; seed: `prisma/seed.ts`
(`npm run db:seed`). Multilingual labels are `Json` columns shaped
`{ "en": "...", "ta": "..." }`; rich per-question content lives in the dedicated
`QuestionTranslation` table (one row per language, `en` mandatory / `ta`
optional).

Models:

- **Student** — registrant profile (unique `mobile`, optional unique `email`,
  state/district/school/class/board, language + verification flags).
- **Admin** — back-office staff; `role` enum `ADMIN | SUPER_ADMIN`, `isActive`,
  `lastLoginAt`.
- **Subject** — the 4 NEET subjects (Physics, Chemistry, Botany, Zoology).
- **Chapter** — belongs to a Subject; `class` (11/12) and `weightage` %
  (drives the random generator).
- **Question** — bank item: subject + chapter, optional `topic`, `difficulty`,
  `year`, `tags[]`, `questionType`
  (`SINGLE_CORRECT | IMAGE_BASED | ASSERTION_REASON`), `status`
  (`DRAFT | REVIEW | PUBLISHED`; only `PUBLISHED` is used by the generator /
  catalogue), `imageUrl`, `isActive` (mirrors `status == PUBLISHED`).
- **QuestionTranslation** — per-language text, options A–D, `correctOption`,
  explanation; unique on `(questionId, language)`.
- **QuestionVersion** — immutable version-history snapshot per question edit
  (`version`, `action`, `editedById/Name`, `snapshot` Json); unique on
  `(questionId, version)`.
- **Test** — a purchasable test: multilingual title/description, `testType`
  (`FULL_TEST | MINI_TEST | CHAPTER_TEST | SUBJECT_TEST | YEAR_PATTERN`),
  optional subject/chapter tags, counts, `durationMinutes`, `price` (default 30),
  `isRandom`, `isPublished`, `availableLanguages[]`, and `rules` (Json:
  `{ difficultyMix, random?: { scope, subjectIds, chapterIds } }`).
- **TestQuestion** — ordered join of fixed questions into a Test (used when
  `Test.isRandom` is false; random tests generate questions per attempt).
- **TestAttempt** — a student's sitting: `status`
  (`IN_PROGRESS | SUBMITTED | AUTO_SUBMITTED`), `selectedLanguage`,
  `remainingSeconds` for resume, `questionOrder[]` + `seed` (frozen paper), and
  `shuffleOptions` (per-attempt answer-option randomisation; true on new
  attempts).
- **Answer** — per-question response in an attempt (`selectedOption`,
  `isCorrect`, `isMarkedForReview`, `timeSpentSeconds`).
- **Result** — one-to-one with an attempt; totals + `score` and JSON
  `chapterAnalysis` / `subjectAnalysis` / `timeAnalysis`.
- **Payment** — Razorpay record (`status`
  `CREATED | SUCCESS | FAILED | REFUNDED`, order/payment ids, unique
  `invoiceNumber`, `invoiceData` snapshot, `failureReason`, `paidAt`).
- **PaymentEvent** — immutable log of a payment's state transitions
  (`fromStatus`/`toStatus`/`source`); every transition is recorded.
- **TestEntitlement** — a student's ownership of a test (unique
  `(studentId, testId)`); the record that unlocks "Start Test".
- **InvoiceCounter** — per-year sequence backing `INV-YYYY-NNNNN` numbers.
- **Country** — admission destinations (6 seeded) with multilingual name/desc.
- **AdmissionLead** — consultancy lead: NEET score/marks, budget, interested
  country, `status` (`NEW | CONTACTED | IN_PROGRESS | CONVERTED | CLOSED`),
  `assignedTo` (Admin).
- **Notification** + **NotificationRead** — multilingual notice with a `type`,
  `targetAudience`, an optional `studentId` (per-student targeting, e.g. payment
  confirmations), and per-student read receipts.
- **OtpToken** — hashed one-time passwords (`purpose`, `channel`, `expiresAt`,
  `attempts`, `consumedAt`); backs registration/login/reset OTP + rate limiting.
- **ContactEnquiry** — public "Contact Us" submissions (`name`, `mobile`,
  `email`, `message`, `status` `NEW | RESPONDED | CLOSED`); admins triage later.
- **AuditLog** — who/what/when record of admin actions (`adminId`, `adminName`
  snapshot, `action`, `entityType`, `entityId`, `details` JSON).

`QuestionTranslation.reviewed` gates student visibility: English is always
authoritative/reviewed; a non-English translation is only shown to students when
`reviewed` is true.

Key indexes: `Question(subjectId, chapterId, difficulty)`, `Payment(studentId)`,
`TestAttempt(studentId)`, `AdmissionLead(status)`.

Seed data: 4 subjects, 20 chapters (5 each, with weightage), 20 bilingual sample
questions, 6 countries, 1 super admin (`superadmin@example.com`) + 1 admin
(`admin@example.com`), and 2 published tests (a random full test + a fixed
Botany genetics chapter test).

## Auth

JWT sessions + role-based route protection. Passwords hashed with **bcryptjs**;
JWTs signed/verified with **jose** (Edge-safe). Validation via shared **zod**
schemas in `lib/validation/auth.ts` (run on client AND server); schema error
messages are bare keys resolved through `auth.errors.<code>` for bilingual
feedback.

**Session model.** On login/verify the server signs a JWT and stores it in an
httpOnly cookie named `session` (7-day expiry, `secure` in production). Claims:
`sub` (user id), `kind` (`student` | `admin`), `role`
(`STUDENT` | `ADMIN` | `SUPER_ADMIN`), `name`. Helpers live in
`lib/auth/session.ts` (Node runtime: `createSession` / `getSession` /
`destroySession`) and `lib/auth/jwt.ts` (`signSession` / `verifySession`,
runtime-agnostic).

**Route protection (`middleware.ts`, Edge).** Verifies the cookie JWT only — no
DB. Rules: `/student/*` → any student; `/admin/*` → `ADMIN` or `SUPER_ADMIN`
(except `/admin/login`, which is public); `/admin/super/*` → `SUPER_ADMIN` only.
Unauthenticated users are redirected to `/login` (student area) or `/admin/login`
(admin area) with a `?next=` param; an admin lacking super rights is sent to
`/admin/dashboard`.

**Registration + OTP.** `/register` is a two-step flow (details → 6-digit mobile
OTP). OTPs are stored **hashed** in the `OtpToken` model (5-min TTL, single-use,
max 5 verify attempts) and **rate-limited to 3 requests / 10 min per (mobile,
purpose)**. Delivery is behind the `OtpProvider` interface
(`lib/otp/provider.ts`): `ConsoleOtpProvider` in dev logs the OTP to the server
console (and non-prod API responses echo it as `devOtp` for testing);
`Msg91OtpProvider` is the production SMS stub (needs `OTP_PROVIDER_API_KEY`).
Email OTP is supported behind the same interface.

**Login.** `/login` has two tabs — Mobile + OTP, and Mobile/Email + Password.
Password login requires a verified mobile. Admins log in at `/admin/login`
(email + password only). Forgot password: `/forgot-password` (mobile OTP →
new password). Students edit their profile at `/student/profile`; changing the
preferred language also updates the `NEXT_LOCALE` cookie.

**API routes** (`app/api/auth/*`, all Node runtime): `register`, `otp/request`,
`otp/verify`, `login`, `password/reset`, `admin/login`, `logout`, `profile`
(PATCH), `me` (GET).

**Key files:** `lib/auth/{jwt,session,password,otp,otp-service}.ts`,
`lib/otp/provider.ts`, `lib/validation/auth.ts`, `lib/data/locations.ts`,
`middleware.ts`, `components/auth/*`. Tests: `tests/*.test.ts` (vitest, `npm test`).

**Seeded logins:** super admin `superadmin@example.com` / `SuperAdmin@123`,
admin `admin@example.com` / `Admin@123`.

## Public website

The marketing site lives in `app/(public)/` and shares chrome via
`app/(public)/layout.tsx` (sticky `PublicHeader` + `PublicFooter`). Pages:
`/` (home), `/about`, `/why-choose-us`, `/services`, `/mock-tests`,
`/admission-guidance`, `/countries`, `/testimonials`, `/faq`, `/contact`.

- **Design:** one primary colour — **deep blue** (`brand` = `#1e40af`, set in
  `tailwind.config.ts`; this recoloured the whole app, auth included). Amber
  `accent` only for the ₹30 value cue. White background, simple cards, inline
  SVG icons (`components/public/icons.tsx`) — no stock photos.
- **Bilingual:** every string comes from `messages/{en,ta}.json`. List content
  (features, values, countries, FAQ, testimonials) is read with `t.raw(...)` and
  cast to typed arrays. The two files must stay structurally identical.
- **Reusable UI:** `components/public/ui.tsx` (Section, Card, SectionHeading,
  buttons), `PageHero`, `CtaBand`, `Logo`.
- **Interactive:** `Faq` is a zero-JS native `<details>` accordion (+ FAQ
  JSON-LD on `/faq`); `Testimonials` is a dependency-free client carousel;
  `ContactForm` posts to `POST /api/contact` (zod `contactEnquirySchema`) →
  `ContactEnquiry`.
- **Performance:** server components by default (content pages ship ~1.6 kB page
  JS); below-the-fold sections use the `.cv-auto` (`content-visibility`) class;
  `next/image` for the hero (local SVG; `images.dangerouslyAllowSVG` in
  `next.config`).
- **SEO:** each page exports `generateMetadata` via `pageMetadata()` in
  `lib/seo.ts` (title/description/canonical/OG/Twitter). Root layout sets
  `metadataBase` + title template `%s · NEET Smart Practice`; OG image `/og.svg`.
- **Disclosure:** the footer and the admission/countries pages carry the
  required disclaimer that eligibility requirements and country-specific
  regulations are disclosed and admission is not guaranteed.

## Internationalization, accessibility & help

**Locale model.** `i18n/config.ts` is the single source of truth. `ALL_LOCALES`
lists every code the app knows about; `localeEnabled` flags which are live;
`locales` is the derived enabled list that the switcher, cookie validation
(`lib/locale.ts`), next-intl request config, and `localeSchema`
(`lib/validation/auth.ts`) all read. `localeNames` gives each its native display
name. **Adding a language needs only:** (1) add the code to `ALL_LOCALES` +
`localeNames` + a `localeEnabled` flag, (2) create `messages/<code>.json` (copy
`en.json`, translate values), (3) add reviewed `QuestionTranslation` rows. Flip
the flag to go live — **no architecture change**. A language can be *scaffolded
but hidden*: present in `ALL_LOCALES` with a messages file but
`localeEnabled = false`, so it never appears in the switcher and its cookie is
ignored. **`messages/hi.json` (Hindi) ships this way** as a ready, full-key
scaffold (English placeholder values) with `localeEnabled.hi = false` — proof of
the contract. The four locale files (`en`, `ta`, `hi`) stay structurally
identical; keep them in sync when adding keys.

**Language selection & persistence.** Offered at registration
(`RegisterForm` → saved to `Student.preferredLanguage`), on the auth screens +
public header + student header via `LanguageSwitcher` (writes the
`NEXT_LOCALE` cookie), in `/student/profile` + `/student/settings`, and
per-attempt before starting a test (`StartAttemptClient` →
`TestAttempt.selectedLanguage`). On login and OTP-verify the server calls
`syncLocaleFromProfile()` (`lib/locale.ts`) so a returning student's saved
language becomes the active locale on any device. The OTP **SMS** is sent in the
recipient's `preferredLanguage` (from the `sms` message namespace).

**Accessibility.** Two cookie-backed modes (`lib/a11y.ts`, same no-flash pattern
as the locale): **Large Font** (`html[data-font-scale="large"]` → root font-size
125%, scaling all rem utilities) and **High Contrast**
(`html[data-contrast="high"]` → WCAG-AA overrides in `globals.css`). The root
layout stamps both attributes on `<html>` server-side. Toggles live in
`AccessibilityMenu` (header popover, on public/auth/student headers) and
`AccessibilitySettings` (the fuller `/student/settings` page). A localized
`SkipLink` (`components/a11y/SkipLink.tsx`) targets `<main id="main-content">`
(present on every page's main landmark). Icon-only controls carry translated
`aria-label`s (see the `a11y` message namespace). Error/404 pages
(`app/not-found.tsx`, `error.tsx`, `global-error.tsx`) and the maintenance screen
are localized (`errors` namespace; `global-error` is bilingual since it renders
without the provider).

**Low-bandwidth.** recharts is code-split behind `next/dynamic({ ssr: false })`
(`PerformanceCharts` → `PerformanceChartsInner`) with a skeleton;
`optimizePackageImports: ['recharts']` in `next.config.mjs`. Route-level
`loading.tsx` skeletons (`components/ui/Skeleton.tsx`) stream on the heavy
student routes (dashboard, tests, performance, results). The exam autosave
retries with back-off and queues failed answer/mark saves, replaying them on the
30s sync and on the browser `online` event so the server never silently diverges
on flaky connections. Images are all small local SVGs.

**Help.** `/help` (public, bilingual, `help` namespace) — step-by-step guides
for register → buy → take → results → consultancy, with screenshot placeholders;
linked from the footer and the student header.

## Admin portal

Back-office at `/admin/*`, guarded by middleware (`ADMIN` / `SUPER_ADMIN`) and,
defence-in-depth, by `requireAdminPage()` / `getAdminSession()`
(`lib/auth/admin.ts`). The portal is **English-only** (labels are inline, not in
the i18n files); only student-facing question *content* follows the translation
rules. Every mutating action is written to `AuditLog` via `logAudit()`
(`lib/audit.ts`).

Layout: authenticated pages live in the `app/(admin)/admin/(portal)/` route
group (so `/admin/login` stays chrome-free). `(portal)/layout.tsx` renders
`AdminNav` (fixed sidebar on desktop, drawer on mobile). Sidebar items are in
`lib/admin/nav.ts`; only **Dashboard** and **Question Bank** are functional —
the rest are `ComingSoon` placeholders.

**Question bank** (`/admin/question-bank`):
- **Subjects & Chapters** (`/subjects`) — per-subject chapter CRUD via
  `ChapterManager`; live warning when a subject's chapter weightages ≠ 100%.
- **List** — paginated, filterable (subject, chapter, difficulty, year, type,
  language availability, status/active) + text search; per-row translation status
  (EN only / EN+TA / EN+TA draft), a **status badge** (Draft / In review /
  Published), an optimistic active toggle, and a **History** link.
- **Create/Edit** (`/new`, `/[id]`) — `QuestionForm` with a **Details** tab
  (subject, dependent chapter, **Topic** [free-text, finer than chapter],
  difficulty, type [A/R disabled = "coming soon"], **Status** [Draft / In
  review / Published], year, tags, correct option, image upload) and a
  **Translations** tab (side-by-side EN | TA for text/options/explanation + a
  "translation reviewed" checkbox).
- **Status workflow** — `Question.status` (`DRAFT | REVIEW | PUBLISHED`) is the
  editorial state; **only `PUBLISHED` questions are used by the generator /
  catalogue**. `isActive` is kept as a mirror of `status == PUBLISHED` so the
  generator/catalogue queries are unchanged; the create/edit/active APIs keep the
  two in sync.
- **Version history** — every create / edit / status change writes an immutable
  `QuestionVersion` snapshot (who/when/action/full content) via
  `writeQuestionVersion` (`lib/admin/question-version.ts`), viewable at
  `/admin/question-bank/[id]/history`.
- **Bulk upload** (`/bulk-upload`) — downloadable CSV template; validate →
  per-row error report → commit valid rows in a transaction (imported as
  `PUBLISHED`). Dedupe is by normalised English-text hash (against existing rows
  and within the file). Row validation lives in `lib/admin/bulk.ts`
  (pure, unit-tested).

**Admin API** (`app/api/admin/*`, Node runtime, all admin-guarded + audited):
`chapters` (+`[id]`), `questions` (+`[id]`, `[id]/active`), `upload`,
`questions/bulk`. Create/edit/active mutations run in a transaction that also
appends the `QuestionVersion` snapshot.

**Image storage** is behind `StorageProvider` (`lib/storage`):
`LocalStorageProvider` writes to `public/uploads/` in dev (gitignored); an
S3 driver stub is selected when `STORAGE_DRIVER=s3`.

## Tests, generator & catalogue

**Random question generator** (`lib/generator`) — a **pure, unit-tested**
`generateQuestionSet(rules, attemptSeed)`:
- distributes questions across subjects/chapters **proportional to chapter
  weightage** (exact, largest-remainder) and matches the requested **difficulty
  mix** as closely as the bank allows;
- **seeded + reproducible** per attempt (mulberry32), so different students get
  different papers but a seed always regenerates the same set;
- for a Tamil attempt, **prefers reviewed-Tamil questions** and returns a
  warning (+ `console.warn`) when it falls back to English-only;
- throws `GeneratorError` when the active bank can't satisfy the rules.
`lib/generator/plan.ts` (DB-backed) builds `GeneratorRules` from a `Test`
(FULL_TEST → 45×4 by weightage = 180 Q / 720 marks; else split by weightage
sum), `checkFeasibility` dry-runs it per available language (Tamil strictly =
reviewed-Tamil only) to gate publishing, and `generateForAttempt` produces the
per-attempt set (fallback on). Tests: `tests/generator.test.ts`.

**Exam engine** (`lib/attempts/*`, `app/(student)/student/tests/[id]/{start,attempt}`,
`components/student/exam/ExamClient`) — server-authoritative timer
(`computeRemainingSeconds`, `GRACE_SECONDS`), optimistic autosave with back-off
retry + a replay queue, 30s resync, and one-attempt-per-test rules. Scoring
(`lib/attempts/result.ts` `computeResult`, **pure/unit-tested**) is NEET
**+4 / −1 / 0**; `finalizeAttempt` is idempotent (conditional `updateMany`) and
writes per-answer correctness + a `Result` (chapter/subject/time analysis).
- **Answer-option randomisation** (`lib/attempts/options.ts`, pure/unit-tested)
  — each attempt presents options in a **shuffled order derived from
  `TestAttempt.seed` + questionId** (mulberry32; nothing stored per question), so
  the exam payload, scoring, and answer review all reconstruct the same order and
  a resume is stable. Answers are recorded in **display space** (the letter the
  student clicked); scoring maps the canonical correct option into that space via
  `canonicalToDisplay`, so `computeResult` is unchanged. `canShuffleOptions`
  skips reordering **where inappropriate** — ASSERTION_REASON questions and
  options that reference position/each other ("All/None of the above", "Both A
  and B", "1 and 3 only"). Gated by `TestAttempt.shuffleOptions` (true on new
  attempts; false for pre-existing ones, which stay identity-ordered → backward
  compatible). EN + TA are reordered identically.
- **Result view** (`lib/reports/*`, `/student/results/[attemptId]`) — score,
  **marks out of 720** and an **Overall Percentage** (marks ÷ max, clamped ≥ 0),
  correct/wrong/skipped, accuracy, subject/chapter/time analysis, weak/strong
  topics + recommendations, and a bilingual `AnswerReview` (options shown in the
  same shuffled order, correct/your-answer highlighted). Same numbers in the
  pdfkit report PDF. Tests: `tests/attempt-options.test.ts`, `attempt-result`,
  `analysis`.

**Admin test builder** (`/admin/tests`) — list (status/type/price/attempts) +
`TestForm` builder: title/description (EN+TA), type, duration, price, **difficulty
mix** (must total 100%), languages, and selection mode — **FIXED**
(`QuestionPicker` searchable via `GET /api/admin/questions`) or **RANDOM** (scope
full-syllabus / chosen subjects / chosen chapters). A **FULL_TEST** is forced to
random, full-syllabus, 180 questions. Publish/unpublish runs `checkFeasibility`
(blocks with per-subject errors). APIs: `POST /api/admin/tests`,
`PATCH|DELETE /api/admin/tests/[id]`, `POST /api/admin/tests/[id]/publish` — all
audited; `test-build.ts` normalises builder input.

**Student catalogue** (`/student/tests`, bilingual) — card grid of **published**
tests (type badge, duration, question count, ₹30, EN/TA icons, difficulty) with
combining, URL-synced filters (Year/Difficulty/Subject[Biology=Botany+Zoology]/
Chapter/Type) and **bilingual search** (matches across EN+TA titles, subject &
chapter names; "Biology"↔"உயிரியல்"). Detail page shows syllabus coverage +
rules and a **Buy ₹30** button (→ `/checkout` placeholder) or **Start Test** if
owned (via a `SUCCESS` `Payment`; `/start` redirects non-owners). Coverage logic:
`lib/student/catalogue.ts`.

## Payments (Razorpay)

Payments unlock tests. See [README.md](./README.md) for Razorpay test-key +
webhook setup. Code lives in `lib/payments/*` and `app/api/payments/*`.

- **Buy flow.** `/student/tests/[id]/checkout` → `CheckoutClient` calls
  `POST /api/payments/create-order` (creates a `CREATED` Payment + a Razorpay
  order; **amount is read from the server-side `Test.price`, never the client**)
  and opens Razorpay Checkout (UPI / cards / net banking). Without real keys,
  `createOrder` returns a **mock order** so the DB flow still runs locally.
- **Two completion paths, both idempotent.** The client success handler calls
  `POST /api/payments/verify` (server verifies the HMAC `order|payment` checkout
  signature). The **webhook `/api/payments/webhook` is the source of truth** —
  it verifies `X-Razorpay-Signature` over the raw body and finalises even if the
  browser closed. `finalizeSuccess` (`lib/payments/service.ts`) claims the
  payment with a conditional `updateMany (status != SUCCESS)`, so it runs
  **exactly once**; a test is never unlocked on unverified client success.
- **On success** (in one transaction): status → SUCCESS, sequential
  `INV-YYYY-NNNNN` allocated (atomic `InvoiceCounter` upsert), `invoiceData`
  snapshot stored, a **`TestEntitlement`** created (unlocks Start Test), a
  per-student **`PAYMENT_CONFIRMATION`** notification, and a `PaymentEvent`.
- **Ownership** everywhere (catalogue, detail, `/start`, dashboard) is checked
  via `TestEntitlement`. Failures show a friendly retry (a retry creates a new
  order). **Invoice PDF** (`pdfkit`, `serverExternalPackages`) at
  `GET /api/payments/[id]/invoice` (owner only) with a GST placeholder line.
- **Student:** `/student/payments` history (test/date/amount/status + invoice
  download / retry), bilingual. **Admin:** `/admin/payments` (revenue cards,
  status/date/student filters, CSV export at `/api/admin/payments/export`).
- Tests: `tests/payments.test.ts` (signature verification + webhook idempotency).

## Common commands

```bash
npm run dev              # start the dev server
npm run build            # production build
npm run start            # run the production build
npm run lint             # lint
npm run prisma:generate  # regenerate the Prisma client
npm run prisma:migrate   # create/apply a dev migration
npm run prisma:studio    # open Prisma Studio
npm run db:seed          # seed subjects, chapters, questions, tests, admins...
npm test                 # run the vitest suite
```

## Environment variables

See `.env.example`. Required: `DATABASE_URL`, `RAZORPAY_KEY_ID`,
`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `OTP_PROVIDER_API_KEY`,
`JWT_SECRET`. Optional: `NEXT_PUBLIC_SITE_URL`, `STORAGE_DRIVER`.
