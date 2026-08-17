# Security audit & hardening

This document records the security review performed before production launch:
what was checked, what was fixed, and what remains as recommendations. Re-run
this review whenever routes, auth, or payment flows change.

## Scope

All 47 API route handlers under `app/api/**`, the Edge `middleware.ts`, session
/JWT handling, the payment flow, file uploads, and database access.

## What was checked

| Area | Method | Result |
| --- | --- | --- |
| **Authentication** on every mutating/data route | Traced each handler's session check (`getSession` / `getAdminSession` / `getSuperAdminSession` / webhook signature) | ✅ No mutating or user-data route is unauthenticated. `middleware.ts` matches only `/student` + `/admin` *pages*, so API routes self-guard — verified each does. |
| **Input validation** | Checked each handler zod-parses body/params before use | ✅ All bodies validated with shared zod schemas. (Fixed: bulk-import envelope — see below.) |
| **Object-level authorization (IDOR)** | For every route returning user-owned data (attempts, payments, invoices, results, notifications, leads), confirmed the query is scoped to `session.sub` | ✅ No IDOR. Attempts via `loadAttemptContext(id, session.sub)`; invoice via `payment.studentId !== session.sub → 404`; result PDF via `buildResultReport(attemptId, session.sub)`; notifications via `visibleToStudentWhere`; leads via `createLead(session.sub, …)`. |
| **Privilege separation** | Confirmed super-admin routes require `SUPER_ADMIN`, not just `ADMIN` | ✅ `admin/admins/*` and `admin/settings` use `getSuperAdminSession()`; middleware guards super-admin page prefixes; self-lockout guard on admin deactivate. |
| **Rate limiting** | Searched for throttling on auth/OTP/payment/public endpoints | ⚠️ OTP was throttled; **password login was not**. Fixed — see below. |
| **Security headers** | Inspected `next.config.mjs` / `middleware.ts` for CSP/HSTS/XFO | ⚠️ None existed. Fixed — see below. |
| **Cookies** | Reviewed `lib/auth/session.ts` cookie options | ✅ `httpOnly`, `secure` in production, `sameSite: 'lax'`, `path:'/'`, 7-day expiry. JWT is HS256 via `jose` with issuer/audience validation; `JWT_SECRET` required. |
| **SQL injection** | Grepped for `$queryRaw*` / `$executeRaw*` / `Prisma.raw` | ✅ All raw SQL (in `lib/admin/reports/queries.ts`, `lib/payments/service.ts`) uses **tagged-template parameterization** (bound `$1,$2,…`). No `*Unsafe` or string interpolation of user input anywhere. |
| **File uploads** | Reviewed `app/api/admin/upload/route.ts` + `lib/storage` | ✅ Admin-only, MIME allowlist (png/jpeg/webp/gif), 2 MB cap, random UUID filenames (no path traversal), extension derived from MIME. Hardened further — see below. |
| **Secrets in client bundle** | Grepped `process.env` usage in `'use client'` files | ✅ No server secret is referenced client-side. Only `NEXT_PUBLIC_SITE_URL` and the Razorpay **publishable Key ID** reach the client (both intended). |

## What was fixed

1. **Login brute-force protection.** Added a DB-backed fixed-window rate limiter
   (`lib/auth/rate-limit.ts`, `RateLimit` model — shared across instances, so it
   works on serverless). Applied to:
   - `POST /api/auth/login` — 10 / 10 min per IP and per identifier.
   - `POST /api/auth/admin/login` — 8 / 10 min per IP and per email.
   - `POST /api/contact` — 5 / 10 min per IP (public, unauthenticated).
   Exceeding a limit returns `429` with `retryAfterSeconds`.

2. **Security response headers** (`next.config.mjs`, applied to every route):
   - **Content-Security-Policy** — `default-src 'self'`, Razorpay allow-listed
     for `script-src`/`frame-src`/`connect-src`, `frame-ancestors 'none'`,
     `object-src 'none'`, `base-uri`/`form-action 'self'`. (`'unsafe-inline'` is
     required for Next's inline bootstrap + Tailwind; nonce upgrade noted below.)
   - **Strict-Transport-Security** `max-age=63072000; includeSubDomains; preload`.
   - **X-Frame-Options: DENY**, **X-Content-Type-Options: nosniff**,
     **Referrer-Policy: strict-origin-when-cross-origin**, **Permissions-Policy**
     (camera/mic/geolocation/FLoC disabled).

3. **Bulk-import envelope validation.** `POST /api/admin/questions/bulk` now
   zod-validates `{ csv, commit }` with a **5 MB CSV cap** (was an unchecked
   cast), preventing an oversized payload from exhausting memory.

4. **Upload magic-byte sniffing.** `sniffImageMime()` verifies the file's actual
   signature (PNG/JPEG/GIF/WEBP) matches the declared `Content-Type`, so a forged
   header can't smuggle a non-image onto disk/CDN.

5. **Production seed hardening.** The dev seed ships default admin passwords
   (`SuperAdmin@123`) and is destructive. A non-destructive **reference-only
   seed** (`prisma/seed-reference.ts`) and a **secure admin provisioner**
   (`prisma/create-admin.ts`, reads password from env) were added for
   production. Never run `npm run db:seed` against production.

## Residual items & recommendations

- **CSP nonces (defence-in-depth).** The CSP uses `'unsafe-inline'` for scripts
  for Next/Tailwind compatibility. A stricter nonce-based CSP requires a
  per-request nonce in `middleware.ts` on every route + `next.config` wiring —
  a worthwhile follow-up, not a launch blocker.
- **Contact-form abuse.** Rate-limited per IP; add a CAPTCHA/honeypot if spam
  becomes an issue.
- **Dependency audit.** `npm audit` currently reports advisories from the dev
  toolchain (e.g. test/build tooling). Review before each release; avoid
  `npm audit fix --force` (breaking) — patch individual packages.
- **Rate-limit cleanup.** `RateLimit` rows are self-expiring by `windowEnd`;
  add a periodic prune (cron `DELETE FROM "RateLimit" WHERE "windowEnd" < now()`)
  or a TTL policy to keep the table small.
- **Secrets management.** Store all secrets in the platform's secret manager
  (never in the repo). Rotate `JWT_SECRET` and Razorpay keys on a schedule;
  rotating `JWT_SECRET` invalidates all sessions (acceptable).
