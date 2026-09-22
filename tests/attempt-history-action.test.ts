import { describe, expect, it } from 'vitest';
import { attemptHistoryAction } from '@/lib/attempts/history-action';

const base = {
  canStartAnotherAttempt: true,
  paidRetriesEnabled: false,
  attemptCount: 1,
  freeAttemptLimit: 3,
  hasActiveAttempt: false,
};

describe('attemptHistoryAction', () => {
  it('offers Practice Again for an eligible completed test', () => {
    expect(attemptHistoryAction(base)).toBe('practice-again');
  });

  it('offers another eligible attempt without a limit while paid retries are disabled', () => {
    expect(attemptHistoryAction({ ...base, attemptCount: 99 })).toBe('practice-again');
  });

  it('routes a legacy or ineligible completed test back to available practice', () => {
    expect(attemptHistoryAction({ ...base, canStartAnotherAttempt: false })).toBe('choose-another');
  });

  it('does not offer a second start action while an attempt is active', () => {
    expect(attemptHistoryAction({ ...base, hasActiveAttempt: true })).toBeNull();
  });
});
