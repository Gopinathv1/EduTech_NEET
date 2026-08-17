/**
 * Pure, dependency-free notification config: the notification types, their icon +
 * colour, and the admin audience modes. Safe to import into client and server
 * code alike (no prisma), and unit-tested.
 */

export const NOTIFICATION_TYPES = [
  'NEW_MOCK_TEST',
  'RESULT',
  'OFFER',
  'COUNSELLING',
  'ADMISSION_ALERT',
  'PAYMENT_CONFIRMATION',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationStyle = {
  /** Emoji icon — renders everywhere with no asset/font dependency. */
  icon: string;
  /** Tailwind classes for the icon chip background + foreground. */
  chip: string;
  /** Accent border colour for the list item. */
  accent: string;
};

export const NOTIFICATION_STYLES: Record<NotificationType, NotificationStyle> = {
  NEW_MOCK_TEST: { icon: '📝', chip: 'bg-brand-soft text-brand', accent: 'border-l-brand' },
  RESULT: { icon: '📊', chip: 'bg-green-100 text-green-700', accent: 'border-l-green-500' },
  OFFER: { icon: '🎁', chip: 'bg-amber-100 text-amber-700', accent: 'border-l-amber-500' },
  COUNSELLING: { icon: '🎓', chip: 'bg-indigo-100 text-indigo-700', accent: 'border-l-indigo-500' },
  ADMISSION_ALERT: { icon: '📣', chip: 'bg-rose-100 text-rose-700', accent: 'border-l-rose-500' },
  PAYMENT_CONFIRMATION: { icon: '✅', chip: 'bg-emerald-100 text-emerald-700', accent: 'border-l-emerald-500' },
};

export function notificationStyle(type: string): NotificationStyle {
  return NOTIFICATION_STYLES[type as NotificationType] ?? NOTIFICATION_STYLES.NEW_MOCK_TEST;
}

/** Admin audience modes when composing a student broadcast. */
export const AUDIENCE_MODES = ['ALL', 'CLASS', 'DISTRICT', 'BOARD'] as const;
export type AudienceMode = (typeof AUDIENCE_MODES)[number];
