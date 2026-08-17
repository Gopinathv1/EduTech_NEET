import { z } from 'zod';
import { mobileSchema } from '@/lib/validation/auth';
import { LEAD_CATEGORIES, BUDGET_RANGES, LEAD_STATUSES, NEET_MAX_SCORE } from '@/lib/admission/config';

/**
 * Validation for the admission-consultancy module. The student lead schema is
 * shared by the client form and the POST route; the admin schemas guard the
 * pipeline mutations. Error messages are bare keys resolved via
 * `auth.errors.<code>` (student side) / used directly (admin side).
 */

const scoreField = z
  .number({ message: 'scoreRange' })
  .int('scoreRange')
  .min(0, 'scoreRange')
  .max(NEET_MAX_SCORE, 'scoreRange');

// Empty string / undefined → undefined; otherwise coerce to a number.
const optionalScore = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
  scoreField.optional(),
);

export const admissionLeadSchema = z.object({
  neetScore: optionalScore,
  marks: optionalScore,
  category: z.enum(LEAD_CATEGORIES, { message: 'selectRequired' }),
  budget: z.enum(BUDGET_RANGES, { message: 'selectRequired' }),
  interestedCountryIds: z.array(z.string().min(1)).min(1, 'countryRequired'),
  parentContact: mobileSchema,
  consent: z.literal(true, { message: 'consentRequired' }),
});

export type AdmissionLeadInput = z.infer<typeof admissionLeadSchema>;

// ---- Admin pipeline mutations --------------------------------------------

export const leadStatusSchema = z.object({
  status: z.enum(LEAD_STATUSES),
  note: z.string().trim().max(1000).optional(),
});

export const leadAssignSchema = z.object({
  assignedToId: z.string().min(1).nullable(),
});

export const leadNoteSchema = z.object({
  note: z.string().trim().min(1, 'required').max(1000),
});

export type LeadStatusInput = z.infer<typeof leadStatusSchema>;
export type LeadAssignInput = z.infer<typeof leadAssignSchema>;
export type LeadNoteInput = z.infer<typeof leadNoteSchema>;
