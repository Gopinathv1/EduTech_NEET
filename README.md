# NEET Smart Practice & Admission Assistance Platform

A cloud-based, mobile-first, bilingual English/Tamil platform for NEET practice, mock tests, and medical-admission assistance.

## Product capabilities

- Student-focused mock-test experience
- Bilingual user experience
- Admin workflows for subjects, chapters, questions, tests, and payments
- Razorpay checkout integration with server-side verification
- Webhook-driven payment confirmation and idempotent payment handling
- Invoice and payment-history flows
- Admin reporting and operational workflows

## Local development

```bash
npm install
cp .env.example .env
# Configure local database and application secrets in .env
npm run prisma:migrate
npm run db:seed
npm run dev
```

Useful commands:

```bash
npm run build
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

## Technology

Next.js, React, TypeScript, Prisma, PostgreSQL, Tailwind CSS, Razorpay, Playwright, and Vitest.

## Security

Never commit real credentials, API keys, database URLs, JWT secrets, or payment secrets. Use environment variables and rotate any credential that has been exposed.

## Portfolio note

This repository demonstrates full-stack product development, database-backed workflows, payment integration, testing, and deployment configuration.
