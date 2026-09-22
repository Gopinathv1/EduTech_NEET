export type AttemptHistoryAction = 'practice-again' | 'choose-another' | null;

export function attemptHistoryAction(input: {
  canStartAnotherAttempt: boolean;
  paidRetriesEnabled: boolean;
  attemptCount: number;
  freeAttemptLimit: number;
  hasActiveAttempt: boolean;
}): AttemptHistoryAction {
  if (input.hasActiveAttempt) return null;
  if (!input.canStartAnotherAttempt) return 'choose-another';
  if (!input.paidRetriesEnabled || input.attemptCount < input.freeAttemptLimit) return 'practice-again';
  return null;
}
