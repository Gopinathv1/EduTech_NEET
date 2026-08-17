import { z } from 'zod';
import { ALL_LOCALES, locales } from '@/i18n/config';
import { CLASS_OPTIONS, BOARD_OPTIONS } from '@/lib/data/locations';

/**
 * Shared auth validation schemas. The SAME schema runs on the client (via
 * react-hook-form's zodResolver) and on the server (API route handlers).
 *
 * Error messages are bare KEYS (e.g. "mobileInvalid"); the UI translates them
 * through the `auth.errors.<key>` message namespace, so validation feedback is
 * fully bilingual.
 */

// Indian mobile number: 10 digits starting 6–9, optional +91 prefix.
// Validated, then normalised to the bare 10-digit form we store.
export const mobileSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s-]/g, '')) // drop spaces/hyphens users may type
  .pipe(z.string().regex(/^(\+?91)?[6-9]\d{9}$/, 'mobileInvalid'))
  .transform((s) => s.slice(-10)); // normalise to the bare 10-digit form we store

export const passwordSchema = z.string().min(8, 'passwordTooShort').max(72, 'passwordTooLong');

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'otpInvalid');

export const emailSchema = z.string().trim().toLowerCase().email('emailInvalid');

// Enum over every known locale (literal tuple), then narrowed to the currently
// ENABLED locales — so a scaffolded/disabled language (e.g. hi) can't be saved
// as a student's preference until it is switched on in i18n/config.
export const localeSchema = z
  .enum(ALL_LOCALES, { message: 'required' })
  .refine((v) => (locales as readonly string[]).includes(v), { message: 'required' });

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'nameTooShort').max(80, 'nameTooLong'),
    email: emailSchema,
    mobile: mobileSchema,
    state: z.string().trim().min(1, 'required'),
    district: z.string().trim().min(1, 'required'),
    schoolName: z.string().trim().min(2, 'schoolTooShort').max(120, 'schoolTooLong'),
    class: z.enum(CLASS_OPTIONS, { message: 'required' }),
    board: z.enum(BOARD_OPTIONS, { message: 'required' }),
    preferredLanguage: localeSchema,
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginOtpRequestSchema = z.object({
  mobile: mobileSchema,
});
export type LoginOtpRequestInput = z.infer<typeof loginOtpRequestSchema>;

// Request an OTP (login / registration resend).
export const otpRequestSchema = z.object({
  mobile: mobileSchema,
  purpose: z.enum(['REGISTRATION', 'LOGIN'], { message: 'required' }),
});
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

// Verify an OTP for login or registration.
export const otpVerifySchema = z.object({
  mobile: mobileSchema,
  otp: otpSchema,
  purpose: z.enum(['REGISTRATION', 'LOGIN'], { message: 'required' }),
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'required'),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

// Profile fields a student may edit (email/mobile are NOT editable here).
export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, 'nameTooShort').max(80, 'nameTooLong'),
  schoolName: z.string().trim().min(2, 'schoolTooShort').max(120, 'schoolTooLong'),
  class: z.enum(CLASS_OPTIONS, { message: 'required' }),
  board: z.enum(BOARD_OPTIONS, { message: 'required' }),
  preferredLanguage: localeSchema,
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
