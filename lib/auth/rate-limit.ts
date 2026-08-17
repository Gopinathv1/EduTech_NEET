import { prisma } from '@/lib/prisma';

/**
 * DB-backed fixed-window rate limiter (see the `RateLimit` model). Shared across
 * instances via Postgres, so it works on serverless/multi-instance hosts where
 * an in-memory limiter would not. Used to blunt brute-force / credential-
 * stuffing on authentication endpoints and spam on the public contact form.
 *
 * For very high traffic a Redis/edge limiter is faster, but Postgres is more
 * than adequate for auth-endpoint volumes and needs no extra infrastructure.
 */

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

/**
 * Register one hit against `key`. Returns `allowed:false` once `max` hits occur
 * within `windowSeconds`, with the seconds until the window resets.
 */
export async function rateLimit(
  key: string,
  opts: { max: number; windowSeconds: number },
): Promise<RateLimitResult> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + opts.windowSeconds * 1000);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimit.findUnique({ where: { key } });

    // No window yet, or the previous window has elapsed → start a fresh one.
    if (!existing || existing.windowEnd <= now) {
      await tx.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, windowEnd },
        update: { count: 1, windowEnd },
      });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (existing.count < opts.max) {
      await tx.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const retry = Math.ceil((existing.windowEnd.getTime() - now.getTime()) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(retry, 1) };
  });
}

/**
 * Best-effort client IP from proxy headers (x-forwarded-for wins, then
 * x-real-ip). Hosts like Vercel/Render set these; falls back to "unknown" so a
 * missing header degrades to a shared bucket rather than throwing.
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

/** Convenience: enforce a limit and, if exceeded, return the retry seconds. */
export async function enforceRateLimit(
  key: string,
  opts: { max: number; windowSeconds: number },
): Promise<number | null> {
  const res = await rateLimit(key, opts);
  return res.allowed ? null : res.retryAfterSeconds;
}
