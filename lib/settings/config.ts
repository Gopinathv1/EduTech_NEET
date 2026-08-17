import { z } from 'zod';

/**
 * Application settings edited by a super admin and stored in the AppSetting table
 * (one row per key). Pure/dependency-free so the admin form, the validation and
 * the server service all share the same shape and defaults.
 */

export type OtpProviderKey = 'console' | 'msg91';

export type AppSettings = {
  /** Default price (INR) pre-filled when creating a new test. */
  testPriceDefault: number;
  /** FULL_TEST score at/below which the "study abroad" banner shows. */
  admissionScoreCutoff: number;
  /** Which OTP delivery provider the platform uses. */
  otpProvider: OtpProviderKey;
  /** Locale codes the platform offers to students. */
  supportedLanguages: string[];
  /** When true, the student area shows a maintenance screen (admins unaffected). */
  maintenanceMode: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  testPriceDefault: 30,
  admissionScoreCutoff: 450,
  otpProvider: 'console',
  supportedLanguages: ['en', 'ta'],
  maintenanceMode: false,
};

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof AppSettings)[];

/** Validation for a settings update (all fields optional — partial patches). */
export const settingsUpdateSchema = z.object({
  testPriceDefault: z.number().int().min(0).max(100000).optional(),
  admissionScoreCutoff: z.number().int().min(0).max(720).optional(),
  otpProvider: z.enum(['console', 'msg91']).optional(),
  supportedLanguages: z.array(z.string().min(2).max(5)).min(1).optional(),
  maintenanceMode: z.boolean().optional(),
});

export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;
