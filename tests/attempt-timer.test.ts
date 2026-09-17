import { describe, it, expect } from 'vitest';
import {
  elapsedSeconds,
  computeRemainingSeconds,
  isTimeUp,
} from '@/lib/attempts/timer';

// The timer is server-authoritative: remaining time is always derived from
// `startedAt` + the test duration, never from a client value. These tests pin
// that logic and the grace window that keeps a just-in-time answer valid.

const start = new Date('2026-01-01T10:00:00.000Z');
const at = (offsetSeconds: number) => new Date(start.getTime() + offsetSeconds * 1000);

describe('elapsedSeconds', () => {
  it('is the whole seconds since start, never negative', () => {
    expect(elapsedSeconds(start, at(0))).toBe(0);
    expect(elapsedSeconds(start, at(90))).toBe(90);
    // A client/server clock that appears to run backwards clamps to 0.
    expect(elapsedSeconds(start, at(-30))).toBe(0);
  });
});

describe('computeRemainingSeconds', () => {
  it('counts down from duration*60 and clamps to [0, total]', () => {
    expect(computeRemainingSeconds(start, 60, at(0))).toBe(3600);
    expect(computeRemainingSeconds(start, 60, at(600))).toBe(3000);
    expect(computeRemainingSeconds(start, 60, at(3600))).toBe(0);
    expect(computeRemainingSeconds(start, 60, at(9999))).toBe(0); // never negative
  });

  it('never exceeds the total even if started in the future', () => {
    expect(computeRemainingSeconds(start, 10, at(-100))).toBe(600);
  });
});

describe('isTimeUp', () => {
  it('is false before the deadline and true at/after it', () => {
    expect(isTimeUp(start, 30, at(1799))).toBe(false);
    expect(isTimeUp(start, 30, at(1800))).toBe(true);
    expect(isTimeUp(start, 30, at(1801))).toBe(true);
  });
});

