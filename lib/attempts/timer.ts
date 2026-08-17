/**
 * Server-authoritative timer logic for a test attempt.
 *
 * The single source of truth for "how much time is left" is `startedAt` plus the
 * test's `durationMinutes` — never a client-supplied value. The client renders a
 * countdown and re-syncs every 30s; every server call recomputes the remaining
 * time from these two stored values so a tampered or lagging client can neither
 * gain time nor keep answering past the deadline.
 *
 * A small grace window absorbs clock skew and network latency so an answer that
 * left the browser just before the deadline is still accepted.
 */

/** Seconds past the hard deadline during which a late answer is still accepted. */
export const GRACE_SECONDS = 15;

/** Elapsed whole seconds since the attempt started (never negative). */
export function elapsedSeconds(startedAt: Date, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000));
}

/** Authoritative remaining seconds, clamped to [0, total]. */
export function computeRemainingSeconds(
  startedAt: Date,
  durationMinutes: number,
  now: Date = new Date(),
): number {
  const total = durationMinutes * 60;
  const remaining = total - elapsedSeconds(startedAt, now);
  return Math.min(total, Math.max(0, remaining));
}

/** True once the countdown has reached zero (time is up, ignoring the grace window). */
export function isTimeUp(
  startedAt: Date,
  durationMinutes: number,
  now: Date = new Date(),
): boolean {
  return computeRemainingSeconds(startedAt, durationMinutes, now) <= 0;
}

/**
 * True once we are past the deadline *and* the grace window — the point at which
 * the server refuses further answers and auto-submits the attempt. Answers that
 * arrive within the grace window (time up but not past grace) are still accepted.
 */
export function isPastGrace(
  startedAt: Date,
  durationMinutes: number,
  now: Date = new Date(),
  grace: number = GRACE_SECONDS,
): boolean {
  const total = durationMinutes * 60;
  return elapsedSeconds(startedAt, now) > total + grace;
}
