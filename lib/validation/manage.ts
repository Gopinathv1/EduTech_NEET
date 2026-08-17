import { z } from 'zod';
import { emailSchema, passwordSchema } from '@/lib/validation/auth';

/** Super-admin "manage admins" validation. */

export const createAdminSchema = z.object({
  name: z.string().trim().min(2, 'nameTooShort').max(80, 'nameTooLong'),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['ADMIN', 'SUPER_ADMIN']),
});

export const updateAdminSchema = z.object({
  role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
  isActive: z.boolean().optional(),
});

export const resetAdminPasswordSchema = z.object({
  password: passwordSchema,
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
