import { z } from 'zod';
import { NOTIFICATION_TYPES, AUDIENCE_MODES } from '@/lib/notifications/types';

/**
 * Admin "compose notification" validation. Both English and Tamil are required so
 * every broadcast is fully bilingual. The audience value is required for the
 * CLASS/DISTRICT/BOARD modes and ignored for ALL.
 */
export const composeNotificationSchema = z
  .object({
    type: z.enum(NOTIFICATION_TYPES),
    titleEn: z.string().trim().min(2, 'required').max(120),
    titleTa: z.string().trim().min(2, 'required').max(120),
    messageEn: z.string().trim().min(2, 'required').max(1000),
    messageTa: z.string().trim().min(2, 'required').max(1000),
    audienceMode: z.enum(AUDIENCE_MODES),
    audienceValue: z.string().trim().max(80).optional(),
    linkUrl: z.string().trim().max(300).optional(),
  })
  .refine((d) => d.audienceMode === 'ALL' || !!d.audienceValue, {
    message: 'audienceValueRequired',
    path: ['audienceValue'],
  });

export type ComposeNotificationInput = z.infer<typeof composeNotificationSchema>;
