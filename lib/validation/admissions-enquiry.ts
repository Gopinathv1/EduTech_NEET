import { z } from 'zod';
import { contactEnquirySchema } from '@/lib/validation/contact';
import { ADMISSION_COUNTRIES } from '@/lib/data/admissions/countries';

export const ADMISSION_STUDY_PATHS = ['Medicine', 'Engineering', 'Other undergraduate', 'Postgraduate', 'Other / undecided'] as const;
export const ADMISSION_CONTACT_PREFERENCES = ['Phone', 'Email', 'WhatsApp'] as const;
export const admissionsEnquirySchema = contactEnquirySchema.pick({ name: true, mobile: true, email: true }).extend({
  studyPath: z.enum(ADMISSION_STUDY_PATHS),
  destination: z.string().refine((value) => value === '' || value === 'other' || ADMISSION_COUNTRIES.some((country) => country.slug === value)),
  programme: z.string().trim().max(120),
  contactPreference: z.enum(ADMISSION_CONTACT_PREFERENCES),
  consent: z.literal(true),
});
export type AdmissionsEnquiryInput = z.infer<typeof admissionsEnquirySchema>;
