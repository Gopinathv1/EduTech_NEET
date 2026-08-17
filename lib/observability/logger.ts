import * as Sentry from '@sentry/nextjs';

/**
 * Minimal structured (JSON) logger for server code. One JSON object per line is
 * easy for log aggregators (CloudWatch, Loki, Datadog, Vercel drains) to parse
 * and filter. `error()` also forwards to Sentry when configured.
 *
 * Usage: `log.info('payment.finalized', { paymentId, invoiceNumber })`
 */
type Fields = Record<string, unknown>;

function emit(level: 'info' | 'warn' | 'error', event: string, fields?: Fields) {
  const line = JSON.stringify({ level, event, ts: new Date().toISOString(), ...fields });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const log = {
  info: (event: string, fields?: Fields) => emit('info', event, fields),
  warn: (event: string, fields?: Fields) => emit('warn', event, fields),
  error: (event: string, err?: unknown, fields?: Fields) => {
    emit('error', event, { ...fields, message: err instanceof Error ? err.message : String(err) });
    if (process.env.SENTRY_DSN && err) {
      Sentry.captureException(err, { tags: { event } });
    }
  },
};
