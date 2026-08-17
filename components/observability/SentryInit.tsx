'use client';

/**
 * Client-side Sentry initialisation, gated on `NEXT_PUBLIC_SENTRY_DSN`.
 *
 * The Sentry SDK is loaded via a *dynamic* import inside a branch guarded by the
 * build-inlined env var: when the DSN is unset at build time the branch is dead
 * code and the (sizeable) Sentry client bundle is eliminated entirely — so
 * low-bandwidth users pay nothing when error tracking is off. When the DSN is
 * set, Sentry is code-split into its own chunk and initialised during hydration.
 *
 * (On Next ≥ 15.3 this could live in `instrumentation-client.ts`; a client
 * module keeps it version-agnostic. Add `withSentryConfig` for source maps —
 * see DEPLOYMENT.md.)
 */
declare global {
  interface Window {
    __sentryInited?: boolean;
  }
}

if (
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_SENTRY_DSN &&
  !window.__sentryInited
) {
  window.__sentryInited = true;
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
      tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    });
  });
}

export default function SentryInit() {
  return null;
}
