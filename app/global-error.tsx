'use client';

import { useEffect } from 'react';

/**
 * Global error boundary — replaces the ROOT layout when the layout itself
 * crashes, so next-intl's provider is NOT available here. It must render its own
 * <html>/<body>, and because we can't resolve the active locale, it shows both
 * English and Tamil so every user understands it. This is the last-resort
 * fallback; ordinary errors are handled by the localized `error.tsx`.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import('@sentry/nextjs').then((Sentry) => Sentry.captureException(error));
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#f8fafc',
          color: '#0f172a',
          textAlign: 'center',
          padding: '1rem',
        }}
      >
        <div style={{ fontSize: '2.5rem' }} aria-hidden="true">
          ⚠️
        </div>
        <h1 style={{ marginTop: '1rem', fontSize: '1.4rem' }}>Something went wrong</h1>
        <p style={{ marginTop: '0.25rem', color: '#475569', fontSize: '0.9rem' }}>
          Sorry, an unexpected error occurred. Please try again.
        </p>
        <p style={{ marginTop: '0.25rem', color: '#475569', fontSize: '0.9rem' }} lang="ta">
          மன்னிக்கவும், எதிர்பாராத பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: '1.5rem',
            background: '#1e40af',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.65rem 1.25rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again / மீண்டும் முயற்சிக்கவும்
        </button>
      </body>
    </html>
  );
}
