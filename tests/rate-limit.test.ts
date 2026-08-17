import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stateful in-memory stand-in for the RateLimit table so we exercise the real
// fixed-window logic in lib/auth/rate-limit without a database.
const store = new Map<string, { key: string; count: number; windowEnd: Date }>();

const tx = {
  rateLimit: {
    findUnique: vi.fn(async ({ where }: { where: { key: string } }) => store.get(where.key) ?? null),
    upsert: vi.fn(
      async ({
        where,
        create,
        update,
      }: {
        where: { key: string };
        create: { key: string; count: number; windowEnd: Date };
        update: { count: number; windowEnd: Date };
      }) => {
        const rec = store.has(where.key)
          ? { ...store.get(where.key)!, ...update }
          : { ...create };
        store.set(where.key, rec);
        return rec;
      },
    ),
    update: vi.fn(
      async ({ where, data }: { where: { key: string }; data: { count: { increment: number } } }) => {
        const rec = store.get(where.key)!;
        rec.count += data.count.increment;
        store.set(where.key, rec);
        return rec;
      },
    ),
  },
};

vi.mock('@/lib/prisma', () => ({
  prisma: { $transaction: (cb: (t: typeof tx) => unknown) => cb(tx) },
}));

import { rateLimit, clientIp } from '@/lib/auth/rate-limit';

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
});

describe('rateLimit (fixed window)', () => {
  it('allows up to max hits then blocks with a retry-after', async () => {
    const opts = { max: 3, windowSeconds: 600 };
    for (let i = 0; i < 3; i++) {
      expect((await rateLimit('login:id:x', opts)).allowed).toBe(true);
    }
    const blocked = await rateLimit('login:id:x', opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(600);
  });

  it('keeps separate buckets per key', async () => {
    const opts = { max: 1, windowSeconds: 600 };
    expect((await rateLimit('a', opts)).allowed).toBe(true);
    expect((await rateLimit('a', opts)).allowed).toBe(false);
    // A different key is unaffected.
    expect((await rateLimit('b', opts)).allowed).toBe(true);
  });

  it('resets once the window has elapsed', async () => {
    const opts = { max: 1, windowSeconds: 600 };
    expect((await rateLimit('k', opts)).allowed).toBe(true);
    expect((await rateLimit('k', opts)).allowed).toBe(false);
    // Simulate the window having expired.
    store.get('k')!.windowEnd = new Date(Date.now() - 1000);
    expect((await rateLimit('k', opts)).allowed).toBe(true); // fresh window
  });
});

describe('clientIp', () => {
  const mk = (headers: Record<string, string>) =>
    new Request('http://localhost/x', { headers });

  it('prefers the first x-forwarded-for entry', () => {
    expect(clientIp(mk({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBe('1.2.3.4');
  });
  it('falls back to x-real-ip, then "unknown"', () => {
    expect(clientIp(mk({ 'x-real-ip': '9.9.9.9' }))).toBe('9.9.9.9');
    expect(clientIp(mk({}))).toBe('unknown');
  });
});
