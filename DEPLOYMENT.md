# Deployment & Operations Runbook

Production deployment guide for the **NEET Smart Practice & Admission Assistance
Platform** (Next.js 15 App Router · Prisma · PostgreSQL · Razorpay). Covers
hosting, database, storage, secrets, migrations, observability, backups, load
testing, a launch checklist mapped to the FRD success metrics, and a
troubleshooting runbook.

> Companion docs: [`SECURITY.md`](./SECURITY.md) (security audit), [`README.md`](./README.md)
> (local dev + Razorpay test setup), `CLAUDE.md` (architecture).

---

## 1. Architecture at a glance

| Concern | Choice | Notes |
| --- | --- | --- |
| App | Next.js 15 (App Router), Node ≥ 20 | Server components + Node route handlers; Edge middleware for auth. |
| DB | Managed PostgreSQL | Prisma ORM. Connection pooling required at scale. |
| Payments | Razorpay | Webhook is the source of truth; idempotent finalisation. |
| Object storage | S3-compatible | Question images. Invoices are generated on the fly (not stored). |
| OTP | SMS provider (MSG91 stub) | Console provider in dev. |
| Error tracking | Sentry (optional) | Guarded by env; zero cost when unset. |

### Recommended default stack
**Vercel** (app) + **Neon** or **Supabase** (Postgres with pooling) +
**Cloudflare R2** or **AWS S3** (storage) + **Sentry** (errors) +
**Better Stack / UptimeRobot** (uptime). This is serverless-friendly and needs
no long-running processes.

### Alternatives
- **Render / Railway / Fly.io** — good if you prefer a always-on container
  (`output: 'standalone'` recommended; add it to `next.config.mjs`). Fly/Render
  also make cron-based backups and the rate-limit prune job easy.
- **AWS** — ECS/Fargate or App Runner + **RDS** (Postgres) + **S3**. Use RDS
  Proxy for pooling.
- The app has **no long-running/in-memory state** (Prisma, storage and OTP
  providers are per-instance singletons), so it scales horizontally. The only
  non-serverless-safe piece is the local-disk upload driver — use S3 in prod.

---

## 2. Environment variables

Full annotated list is in [`.env.example`](./.env.example). Set these in the
platform's secret manager **per environment** (staging + production) — never
commit real values.

**Required (app throws / breaks without them):**

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection (pooled URL in prod). |
| `JWT_SECRET` | Signs session JWTs. Use `openssl rand -base64 48`. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Live payment keys (`rzp_live_*`). |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies webhooks (empty → all webhooks 400). |
| `OTP_PROVIDER_API_KEY` | SMS gateway; **required in production**. |
| `NEXT_PUBLIC_SITE_URL` | Real https URL (SEO/OG canonical). |

**Recommended / conditional:** `DIRECT_URL` (pooled DBs — see §4),
`STORAGE_DRIVER=s3` + `S3_*` (see §5), `NEET_TAMIL_FONT_*` (see §6),
`SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` (see §9), `ADMISSION_SCORE_CUTOFF`.

Keep **staging** and **production** on separate databases, storage buckets,
Razorpay keys (test vs live), and Sentry environments.

---

## 3. Build & run

```bash
npm ci                 # installs deps; postinstall runs `prisma generate`
npm run prisma:deploy  # apply migrations (prisma migrate deploy)
npm run build          # next build
npm run start          # next start (production server)
```

- **Node**: pinned to `>=20` (`package.json#engines`). Use Node 20 LTS.
- **Prisma client**: generated automatically via the `postinstall` hook.
- `eslint.ignoreDuringBuilds` is `true`, so lint won't block the build — CI runs
  lint separately (see §8).
- On Vercel, set the **Install Command** to `npm ci`, **Build Command** to
  `prisma migrate deploy && next build` (or run migrations as a separate release
  step — see §4).

---

## 4. Database & migrations

### Provisioning
Create a managed Postgres (Neon/Supabase/RDS). At scale, **use connection
pooling** — serverless functions open many short-lived connections:

- Point `DATABASE_URL` at the **pooled** endpoint and append
  `?pgbouncer=true&connection_limit=<n>` (size to your plan).
- Set `DIRECT_URL` to the **direct** (non-pooled) endpoint and add it to the
  Prisma datasource — migrations run DDL, which a transaction pooler can't do:

  ```prisma
  datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")   // pooled
    directUrl = env("DIRECT_URL")     // direct, for migrations
  }
  ```
  (Add the `directUrl` line before the first pooled deploy.)

### Migration strategy — use `migrate deploy`, never `db push`/`migrate dev` in prod
The repo ships a complete migration history in `prisma/migrations/` (the earlier
phases' `db push` drift was reconciled into
`20260805120000_phase8_to_13_catchup`). Deploy flow:

```bash
npx prisma migrate deploy   # applies pending migrations, idempotent
```

- Run this as a **release/pre-deploy step** (before the new app version serves
  traffic), not per-instance.
- Verify with `npx prisma migrate status` (should say "up to date").
- To create future migrations in dev: `npm run prisma:migrate -- --name <change>`
  (this replaces the `db push` workflow used during early development).

### Seeding — reference data ONLY in production
The dev seed (`npm run db:seed`) is **destructive** (wipes students/payments)
and creates **default-password admins** — never run it in production. Instead:

```bash
npm run db:seed:reference   # idempotent, non-destructive: subjects, chapters, countries
```

Then provision the super admin **securely** (password from env, never on the
command line history in plaintext logs):

```bash
ADMIN_EMAIL=you@your-org.in ADMIN_PASSWORD='a-strong-secret' \
ADMIN_ROLE=SUPER_ADMIN npm run admin:create
```

Real question content and tests are added afterwards via the admin portal
(bulk CSV import + test builder).

---

## 5. Object storage (question images)

Local disk (`public/uploads`) is **dev-only** — it's wiped on redeploy and not
shared across instances. For production set `STORAGE_DRIVER=s3` and the `S3_*`
vars. The provider (`lib/storage/index.ts`) works with **AWS S3, Cloudflare R2,
Supabase Storage, and MinIO**:

- AWS S3: `S3_BUCKET`, `S3_REGION`, credentials (or an IAM role — omit keys).
- R2/MinIO/Supabase: also set `S3_ENDPOINT` + `S3_FORCE_PATH_STYLE=true`.
- Serve via CDN by setting `S3_PUBLIC_URL` (e.g. a CloudFront/R2 public domain).
- Uploaded objects need public read (bucket policy, or `S3_OBJECT_ACL=public-read`
  if the bucket uses ACLs) since `<img>` loads them directly.
- If images are served from a different host, add it to `images.remotePatterns`
  in `next.config.mjs` so `next/image` accepts it.

**Invoices** are generated per-request (owner-only, `Cache-Control: private,
no-store`) and are **not** stored — no storage dependency.

---

## 6. PDF fonts (Tamil)

Invoice + result PDFs render Tamil via a bundled font. On a Linux host with no
Tamil font, PDFs **silently fall back to English**. Either:

- Commit an OFL **Noto Sans Tamil** to `assets/fonts/NotoSansTamil-Regular.ttf`
  and `…-Bold.ttf` (resolved relative to `process.cwd()`; ensure the deploy
  bundle includes `assets/`), **or**
- Set `NEET_TAMIL_FONT_REGULAR` / `NEET_TAMIL_FONT_BOLD` to absolute paths.

`pdfkit` is kept external (`serverExternalPackages`) so it can read its `.afm`
metric files at runtime — verify these are traced into the deploy bundle
(Vercel/nft handles this; on Docker ensure `node_modules/pdfkit` ships intact).
Update the **GST placeholder** in `lib/payments/invoice.ts` (GSTIN + rate)
before charging real money.

---

## 7. Razorpay (live)

1. In the Razorpay dashboard, switch to **Live mode**, get `rzp_live_*` keys, set
   `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
2. Create a **webhook** → URL `https://<your-domain>/api/payments/webhook`,
   events `payment.captured`, `order.paid`, `payment.failed`. Copy the signing
   secret into `RAZORPAY_WEBHOOK_SECRET`.
3. The webhook is the **source of truth**: it verifies the signature over the raw
   body and finalises payments idempotently even if the browser closes. The
   client `verify` call is only the fast path.
4. Test with a ₹1 live transaction, confirm the entitlement + invoice + payment
   confirmation notification appear, then refund it.

---

## 8. CI/CD

`.github/workflows/ci.yml` runs on every push/PR:

- **quality** job (required gate): `npm ci` → **lint** → **typecheck** →
  **tests** (148 vitest unit/integration) → **build**. No DB needed (tests mock
  Prisma).
- **e2e** job: spins up Postgres, `prisma db push` + seed, installs Chromium, and
  runs the Playwright happy-path (`e2e/happy-path.spec.ts`:
  register → OTP → buy → take test → result → consultancy lead).

Wire your host's deploy to trigger on merges to the main branch **after** CI is
green, with `prisma migrate deploy` as a pre-serve release step.

---

## 9. Observability

### Error tracking (Sentry)
Set `SENTRY_DSN` (server/edge) and `NEXT_PUBLIC_SENTRY_DSN` (client) to enable.
When unset, Sentry is fully disabled and **eliminated from the client bundle**
(dynamic import behind a build-time flag). Wiring:
- Server/edge: `instrumentation.ts` (`register` + `onRequestError`).
- Client: `components/observability/SentryInit.tsx` (in the root layout) +
  capture in `app/global-error.tsx`.
- Route Sentry events through a same-origin **tunnel** (Sentry option) if you
  want to avoid adding the ingest host to the CSP `connect-src`.
- For **source maps / releases**, wrap the config with `withSentryConfig`
  (`@sentry/nextjs`) and set `SENTRY_AUTH_TOKEN` + org/project in CI.

### Health checks
- Liveness: `GET /api/health` → `{ status: "ok" }`.
- Readiness (DB ping): `GET /api/health?deep=1` → `200` with `database:"ok"`, or
  `503` if Postgres is unreachable. Point the load balancer's readiness probe at
  the deep variant.

### Structured logs
`lib/observability/logger.ts` emits one JSON object per line (`level`, `event`,
`ts`, fields) — parseable by CloudWatch/Loki/Datadog/Vercel drains. `log.error`
also forwards to Sentry. Ship stdout to your aggregator.

### Uptime
Add an external monitor (UptimeRobot/Better Stack/Pingdom) hitting
`/api/health?deep=1` every 1–5 min with alerting to email/Slack. Target
**99.9%** availability (≈ 43 min/month budget).

---

## 10. Backups & restore

**Automated daily backups** (retain ≥ 7 daily + 4 weekly):
- Managed providers: enable **Point-in-Time Recovery** (Neon/Supabase/RDS all
  support it) — this is the simplest path and gives sub-day RPO.
- Self-managed / extra copies: a daily `pg_dump` to object storage via cron:
  ```bash
  pg_dump "$DIRECT_URL" -Fc | \
    aws s3 cp - "s3://neet-backups/$(date +%F).dump"
  ```

**Restore procedure (rehearse quarterly):**
1. Provision a fresh database (or use PITR to a timestamp).
2. From a dump: `pg_restore --clean --if-exists -d "$NEW_DATABASE_URL" backup.dump`.
3. `npx prisma migrate status` against the restored DB (should be up to date).
4. Point `DATABASE_URL`/`DIRECT_URL` at the restored DB, redeploy, smoke-test
   login + a payment + a test attempt.
5. Record the actual RTO. Keep a **restore-verified** date in your ops log.

---

## 11. Load & performance

Run the k6 sanity check against **staging** before launch:

```bash
BASE_URL=https://staging.example.in \
SESSION_COOKIE=<a-logged-in-student-session-cookie> \
TEST_ID=<a-published-test-id> \
npm run load
```

It ramps to **500 concurrent students** and asserts the FRD targets:
`http_req_duration p95 < 2000ms` and `http_req_failed < 1%`, exercising the
catalogue, dashboard, and test-engine entry. Size the DB connection pool to the
concurrency first (a 500-VU run with a 10-connection pool will queue). Never
load-test production.

Built-in performance measures: recharts is code-split, heavy routes have
`loading.tsx` skeletons, images are small SVGs, below-the-fold sections use
`content-visibility`. Verify Core Web Vitals in staging (Lighthouse, slow-3G).

---

## 12. Launch checklist (mapped to FRD success metrics)

**Page loads < 2s**
- [ ] k6 p95 < 2000ms on catalogue/dashboard/test-engine at 500 VUs (§11).
- [ ] Lighthouse on slow-3G ≥ "good" for the home, catalogue, and dashboard.
- [ ] DB pooling configured; pool sized to peak concurrency.

**Payment success rate trackable (target 90%+)**
- [ ] Razorpay **live** keys + webhook configured and signature-verified (§7).
- [ ] Admin → Payments / Financials dashboards show revenue + status breakdown;
      export CSV works. (Payment status funnel = success-rate signal.)
- [ ] ₹1 live test transaction completed end-to-end, then refunded.
- [ ] Invoice GST details updated in `lib/payments/invoice.ts`.

**Test completion rate trackable (target 80%+)**
- [ ] Test engine verified: start → autosave → resume → submit/auto-submit.
- [ ] Attempt statuses (`IN_PROGRESS`/`SUBMITTED`/`AUTO_SUBMITTED`) visible in
      admin reports (completion = submitted ÷ started).

**Capacity: 10,000 registered students, 5,000 paid tests**
- [ ] DB plan sized for the row counts + indexes present (schema is indexed on
      the hot paths).
- [ ] S3 storage for question images (§5); backups enabled (§10).
- [ ] OTP provider plan sized for registration volume; SMS credits funded.

**General go-live**
- [ ] All required env vars set in production (§2); secrets in a secret manager.
- [ ] `prisma migrate deploy` run; `migrate status` clean; reference seed applied;
      super admin provisioned with a real password (§4).
- [ ] Custom domain + HTTPS; `NEXT_PUBLIC_SITE_URL` = the real URL.
- [ ] Security headers present (verify `curl -I https://<domain>`), CSP doesn't
      break Razorpay checkout (§ `SECURITY.md`).
- [ ] Sentry receiving events; health check + uptime monitor live; backups
      verified by a test restore.
- [ ] Bilingual spot-check (EN/TA) of key flows; Tamil PDF font bundled (§6).

---

## 13. Runbook — common issues

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| **OTP never arrives** in prod | `OTP_PROVIDER_API_KEY` unset (app throws) or the MSG91 `sendSms` stub not implemented | Set the key; implement the gateway call in `lib/otp/provider.ts`. Dev echoes OTP as `devOtp`; prod does not. |
| **Payments never unlock** | Webhook not configured / wrong `RAZORPAY_WEBHOOK_SECRET` (empty → 400) | Recreate the webhook (§7); confirm `X-Razorpay-Signature` verifies. Webhook is source of truth even if the client `verify` fails. |
| **`prisma migrate deploy` fails on a pooled URL** | DDL over a transaction pooler | Set `DIRECT_URL` to the direct endpoint (§4). |
| **502/timeouts under load** | DB connection pool exhausted | Add pooling + `connection_limit`; scale the DB; re-run k6. |
| **Uploaded images 404 after redeploy** | Still on local-disk driver | Set `STORAGE_DRIVER=s3` + `S3_*` (§5). |
| **Tamil PDFs show English only** | No Tamil font on host | Bundle `assets/fonts/NotoSansTamil-*.ttf` or set `NEET_TAMIL_FONT_*` (§6). |
| **Razorpay checkout blocked in browser** | CSP too strict | Ensure `checkout.razorpay.com`/`api.razorpay.com` are in the CSP (they are by default in `next.config.mjs`). |
| **Everyone logged out suddenly** | `JWT_SECRET` changed/rotated | Expected on rotation — all sessions invalidate; users re-login. |
| **`RateLimit` table growing** | No prune job | Schedule `DELETE FROM "RateLimit" WHERE "windowEnd" < now()` (§ `SECURITY.md`). |
| **Maintenance page shown to students** | `maintenanceMode` system setting on | Toggle it off in Super Admin → System. |

---

## 14. Post-launch

- Watch Sentry + logs for the first 48h; set alert thresholds.
- Review the security audit (`SECURITY.md`) and `npm audit` each release.
- Rehearse a DB restore quarterly; rotate secrets on a schedule.
- Track the FRD metrics (payment success %, completion %, page speed) from the
  admin reports and your monitoring, and iterate.
