# NEET Smart Practice & Admission Assistance Platform

A cloud-based, mobile-first, bilingual (English/Tamil) web platform that sells
affordable ₹30 NEET mock tests and generates qualified leads for overseas medical
admission guidance.

Full architecture and conventions live in [CLAUDE.md](./CLAUDE.md). This README
covers local setup and the Razorpay payment configuration.

## Getting started

```bash
npm install
cp .env.example .env        # then fill in the values below
npm run prisma:migrate      # apply migrations to your Postgres database
npm run db:seed             # seed subjects, chapters, questions, tests, admins
npm run dev                 # http://localhost:3000
```

Seeded logins: super admin `superadmin@example.com` / `SuperAdmin@123`,
admin `admin@example.com` / `Admin@123`.

Useful scripts: `npm run build`, `npm start`, `npm run lint`, `npm test`,
`npm run prisma:studio`.

## Environment variables

See [`.env.example`](./.env.example). Required: `DATABASE_URL`, `JWT_SECRET`,
`OTP_PROVIDER_API_KEY`, and the Razorpay keys below.

## Configuring Razorpay (test mode)

Payments use Razorpay Checkout with **server-side signature verification** and a
**webhook that is the source of truth** (a payment completes even if the user
closes the browser after paying). Both the verify and webhook paths are
idempotent — a payment is finalised exactly once.

### 1. Get test API keys

1. Sign in at <https://dashboard.razorpay.com> and switch to **Test Mode**
   (toggle, top-left).
2. Go to **Settings → API Keys → Generate Test Key**.
3. Put them in `.env`:

   ```env
   RAZORPAY_KEY_ID="rzp_test_XXXXXXXXXXXXXX"
   RAZORPAY_KEY_SECRET="XXXXXXXXXXXXXXXXXXXXXXXX"
   ```

> Without real keys the app runs in a **mock-order** mode: `create-order`
> returns a fake order id (so the DB flow works), but the Razorpay Checkout modal
> can't open. The server-side signature/webhook logic is fully testable regardless
> (see below).

### 2. Enable payment methods

In the Razorpay Dashboard, **Settings → Configuration / Payment Methods**, enable
**UPI, Debit card, Credit card and Net Banking** for test mode. The standard
Checkout then exposes them automatically.

### 3. Configure the webhook

Create the webhook at **Settings → Webhooks → Add New Webhook**:

- **Webhook URL:** `https://<your-host>/api/payments/webhook`
- **Secret:** any strong string — put the same value in `.env`:

  ```env
  RAZORPAY_WEBHOOK_SECRET="whsec_your_secret"
  ```

- **Active events:** `payment.captured`, `order.paid`, and `payment.failed`.

#### Exposing the webhook to localhost

Razorpay must reach your machine, so tunnel `localhost:3000`:

```bash
# Option A — ngrok
ngrok http 3000
# use the https URL, e.g. https://abcd-1234.ngrok-free.app/api/payments/webhook

# Option B — cloudflared
cloudflared tunnel --url http://localhost:3000
```

Set the tunnel's `…/api/payments/webhook` as the Webhook URL. You can also use the
Dashboard's **"Send test webhook"** button to fire a signed event at it.

### 4. Test a payment

- Open a test from `/student/tests`, click **Buy for ₹30**, and pay with a
  [Razorpay test instrument](https://razorpay.com/docs/payments/payments/test-card-details/)
  (e.g. test UPI `success@razorpay`, or card `4111 1111 1111 1111`, any future
  expiry/CVV).
- On success the test unlocks (**Start Test**), an invoice number is generated,
  a payment-confirmation notification is created, and the invoice PDF is
  downloadable from `/student/payments`.
- Admins can review everything (with filters + CSV export) at `/admin/payments`.

### Security notes

- The charged **amount always comes from the server-side `Test.price`** — never
  from the client.
- The test is **never unlocked on client-side success alone**; the checkout
  signature is verified server-side, and the webhook independently confirms it.
- Every payment state transition is recorded in the `PaymentEvent` log.

### Automated tests

```bash
npm test        # includes signature verification + webhook idempotency
```
