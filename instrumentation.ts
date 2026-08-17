import * as Sentry from '@sentry/nextjs';

/**
 * Next.js server/edge instrumentation. Sentry initialises here (once per
 * runtime) only when `SENTRY_DSN` is set, so error tracking is entirely opt-in
 * via env and a no-op otherwise. `onRequestError` forwards uncaught server
 * errors (route handlers, RSC) to Sentry.
 */
export async function register() {
  if (!process.env.SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
