import { z } from 'zod';
import { mobileSchema } from '@/lib/validation/auth';

/**
 * Contact-form validation, shared by the client form and the /api/contact
 * route. Error messages are bare keys resolved via `auth.errors.<code>`.
 */
export const contactEnquirySchema = z.object({
  name: z.string().trim().min(2, 'nameTooShort').max(80, 'nameTooLong'),
  mobile: mobileSchema,
  email: z.string().trim().toLowerCase().email('emailInvalid'),
  message: z.string().trim().min(10, 'messageTooShort').max(1000, 'messageTooLong'),
});

export type ContactEnquiryInput = z.infer<typeof contactEnquirySchema>;
