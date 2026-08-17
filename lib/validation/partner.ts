import { z } from 'zod';
import { emailSchema, mobileSchema, passwordSchema } from '@/lib/validation/auth';

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const partnerRegisterSchema = z
  .object({
    agencyName: z.string().trim().min(2, 'required').max(120, 'nameTooLong'),
    contactPerson: z.string().trim().min(2, 'required').max(80, 'nameTooLong'),
    mobile: mobileSchema,
    email: emailSchema,
    city: z.string().trim().min(2, 'required').max(80, 'nameTooLong'),
    state: z.string().trim().min(2, 'required').max(80, 'nameTooLong'),
    country: z.string().trim().min(2, 'required').max(80, 'nameTooLong').default('India'),
    website: optionalText.pipe(z.string().url('urlInvalid').optional()),
    registrationNumber: optionalText.pipe(z.string().max(80, 'nameTooLong').optional()),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'required'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  });
export type PartnerRegisterInput = z.infer<typeof partnerRegisterSchema>;

export const partnerLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'required'),
});
export type PartnerLoginInput = z.infer<typeof partnerLoginSchema>;

export const partnerProfileSchema = z.object({
  contactPerson: z.string().trim().min(2, 'required').max(80, 'nameTooLong'),
  mobile: mobileSchema,
  city: z.string().trim().min(2, 'required').max(80, 'nameTooLong'),
  state: z.string().trim().min(2, 'required').max(80, 'nameTooLong'),
  country: z.string().trim().min(2, 'required').max(80, 'nameTooLong'),
  website: optionalText.pipe(z.string().url('urlInvalid').optional()),
});
export type PartnerProfileInput = z.infer<typeof partnerProfileSchema>;

export const agencyStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'MORE_INFO_REQUIRED', 'SUSPENDED', 'PENDING']),
  note: z.string().trim().max(500, 'messageTooLong').optional(),
});
export type AgencyStatusInput = z.infer<typeof agencyStatusSchema>;
