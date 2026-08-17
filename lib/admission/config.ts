/**
 * Static configuration + pure helpers for the admission-consultancy module.
 * Kept dependency-free so it can be imported by validation, the student form, the
 * result-page banner and the admin filters alike, and unit-tested in isolation.
 */

/** Reservation categories a NEET candidate selects. Stored verbatim on the lead. */
export const LEAD_CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS'] as const;
export type LeadCategory = (typeof LEAD_CATEGORIES)[number];

/**
 * Budget-range codes (total course cost, INR lakhs). We store the code and render
 * a bilingual label from the `consultancy.budgets.<code>` message key, so ranges
 * can be relabelled without touching stored data.
 */
export const BUDGET_RANGES = ['UNDER_15', 'B15_25', 'B25_40', 'ABOVE_40', 'UNSURE'] as const;
export type BudgetRange = (typeof BUDGET_RANGES)[number];

/** English budget labels — used across the admin portal (which is English-only)
 *  and safe to import into client components (no server deps). */
export const BUDGET_LABEL_EN: Record<BudgetRange, string> = {
  UNDER_15: 'Under ₹15L',
  B15_25: '₹15–25L',
  B25_40: '₹25–40L',
  ABOVE_40: 'Above ₹40L',
  UNSURE: 'Not sure',
};

export function budgetLabelEn(code: string | null | undefined): string {
  return code && code in BUDGET_LABEL_EN ? BUDGET_LABEL_EN[code as BudgetRange] : '—';
}

/** NEET is scored out of 720; used to bound the score/marks inputs. */
export const NEET_MAX_SCORE = 720;

/**
 * Score at or below which a FULL_TEST result shows the "explore admission options
 * abroad" banner. Configurable via env so the business can tune it without a
 * deploy; falls back to a sensible default.
 */
export function admissionScoreCutoff(): number {
  const raw = Number(process.env.ADMISSION_SCORE_CUTOFF);
  return Number.isFinite(raw) && raw > 0 ? raw : 450;
}

/** Whether to surface the admission banner for a given result. */
export function shouldShowAdmissionBanner(input: {
  testType: string;
  score: number;
  cutoff?: number;
}): boolean {
  const cutoff = input.cutoff ?? admissionScoreCutoff();
  return input.testType === 'FULL_TEST' && input.score < cutoff;
}

/** The student-facing progress step a lead status maps to (0-based). */
export const LEAD_STUDENT_STEPS = ['submitted', 'under_review', 'contacted'] as const;
export type LeadStudentStep = (typeof LEAD_STUDENT_STEPS)[number];

/**
 * Map a raw LeadStatus to the student's 3-step tracker index. CONVERTED/CLOSED are
 * shown at the final step (their own label is handled separately).
 */
export function leadStudentStepIndex(status: string): number {
  switch (status) {
    case 'NEW':
      return 0;
    case 'IN_PROGRESS':
      return 1;
    case 'CONTACTED':
    case 'CONVERTED':
    case 'CLOSED':
      return 2;
    default:
      return 0;
  }
}

export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'CLOSED'] as const;
export type LeadStatusCode = (typeof LEAD_STATUSES)[number];
