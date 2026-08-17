/**
 * Pure helpers for admin reports: date-range parsing, day bucketing for
 * time-series charts, pagination, and percentage formatting. Kept dependency-free
 * and unit-tested.
 */

export type DateRange = { from: Date; to: Date };

const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC day key "YYYY-MM-DD". */
export function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Parse `from`/`to` (YYYY-MM-DD) query params into an inclusive range. Falls back
 * to the last `days` days. `to` is pushed to end-of-day so same-day ranges work.
 */
export function parseRange(from?: string, to?: string, days = 30): DateRange {
  // Explicit YYYY-MM-DD inputs use UTC day boundaries so they round-trip through
  // `dateKey` (which, like SQL date_trunc, is UTC). The default relative range
  // uses the local day so "last 30 days" feels right to the operator.
  const now = new Date();

  let toDate: Date;
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    toDate = new Date(`${to}T23:59:59.999Z`);
  } else {
    toDate = new Date(now);
    toDate.setHours(23, 59, 59, 999);
  }

  let fromDate: Date;
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
    fromDate = new Date(`${from}T00:00:00.000Z`);
  } else {
    fromDate = new Date(toDate.getTime() - (days - 1) * DAY_MS);
    fromDate.setHours(0, 0, 0, 0);
  }
  return { from: fromDate, to: toDate };
}

/** Inclusive list of UTC day keys between two dates (capped to avoid runaway). */
export function eachDay(from: Date, to: Date, cap = 400): string[] {
  const keys: string[] = [];
  const cur = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  while (cur <= end && keys.length < cap) {
    keys.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return keys;
}

/** Fill a daily series across the range, defaulting missing days to 0. */
export function fillSeries(from: Date, to: Date, counts: Map<string, number>): { date: string; value: number }[] {
  return eachDay(from, to).map((date) => ({ date, value: counts.get(date) ?? 0 }));
}

export type Pagination = { page: number; perPage: number; skip: number; take: number };

/** Parse a 1-based page param with a fixed page size. */
export function parsePage(pageParam?: string, perPage = 25): Pagination {
  const n = Number(pageParam);
  const page = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}

export function totalPages(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage));
}

/** Percentage 0–100, guarding divide-by-zero, rounded to one decimal. */
export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}
