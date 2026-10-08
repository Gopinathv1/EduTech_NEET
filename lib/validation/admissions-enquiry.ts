import { z } from 'zod';
import { contactEnquirySchema } from '@/lib/validation/contact';
import { ADMISSION_COUNTRIES } from '@/lib/data/admissions/countries';
import { ADMISSION_UNIVERSITIES } from '@/lib/data/admissions/universities';

export const ADMISSION_STUDY_PATHS = ['Medicine', 'Engineering', 'Other undergraduate', 'Postgraduate', 'Other / undecided'] as const;
export const ADMISSION_CONTACT_PREFERENCES = ['Phone', 'Email', 'WhatsApp'] as const;
export const admissionsEnquirySchema = contactEnquirySchema.pick({ name: true, mobile: true, email: true }).extend({
  studyPath: z.enum(ADMISSION_STUDY_PATHS),
  destination: z.string().refine((value) => value === '' || value === 'other' || ADMISSION_COUNTRIES.some((country) => country.slug === value)),
  programme: z.string().trim().max(120),
  universityId: z.string().default(''),
  contactPreference: z.enum(ADMISSION_CONTACT_PREFERENCES),
  consent: z.literal(true),
}).refine((input) => {
  if (!input.universityId) {
    // Older open tabs send only a university name. Fail closed rather than
    // silently saving a catalogue university without its authoritative ID.
    return !ADMISSION_UNIVERSITIES.some((university) => university.name === input.programme);
  }
  return ADMISSION_UNIVERSITIES.some((university) => university.id === input.universityId && university.countrySlug === input.destination && university.name === input.programme);
}, { message: 'University selection is inconsistent. Select the university again.', path: ['universityId'] });
export type AdmissionsEnquiryInput = z.infer<typeof admissionsEnquirySchema>;
