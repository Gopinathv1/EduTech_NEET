/**
 * Paid retries are retained for a future commercial release.  The strict
 * comparison intentionally makes the marketing/free-access mode the safe
 * default for every environment that does not opt in explicitly.
 */
export function examPaidRetriesEnabled() {
  return process.env.EXAM_PAID_RETRIES_ENABLED === 'true';
}
