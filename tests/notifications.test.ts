import { describe, it, expect } from 'vitest';
import { computeRank, type LeaderboardEntry } from '@/lib/reports/rank';
import { visibleToStudentWhere } from '@/lib/notifications/query';
import { audienceStudentWhere } from '@/lib/notifications/create';
import { notificationStyle, NOTIFICATION_TYPES } from '@/lib/notifications/types';
import { composeNotificationSchema } from '@/lib/validation/notification';

describe('computeRank', () => {
  const board: LeaderboardEntry[] = [
    { studentId: 'a', score: 700 },
    { studentId: 'b', score: 640 },
    { studentId: 'c', score: 640 },
    { studentId: 'd', score: 500 },
  ];

  it('ranks by best score with ties sharing a rank', () => {
    expect(computeRank(board, 'a')).toEqual({ rank: 1, total: 4, bestScore: 700 });
    // Two students tie at 640 → both rank 2 (one student strictly ahead).
    expect(computeRank(board, 'b')).toEqual({ rank: 2, total: 4, bestScore: 640 });
    expect(computeRank(board, 'c')).toEqual({ rank: 2, total: 4, bestScore: 640 });
    expect(computeRank(board, 'd')).toEqual({ rank: 4, total: 4, bestScore: 500 });
  });

  it('returns null rank for a student with no full-test result', () => {
    expect(computeRank(board, 'zzz')).toEqual({ rank: null, total: 4, bestScore: null });
  });
});

describe('visibleToStudentWhere', () => {
  const student = { id: 's1', class: '12', district: 'Chennai', board: 'State Board' };

  it('includes the student’s own messages and matching broadcasts', () => {
    const where = visibleToStudentWhere(student);
    expect(where.isPublished).toBe(true);
    expect(Array.isArray(where.OR)).toBe(true);
    const [personal, broadcast] = where.OR as Record<string, unknown>[];
    expect(personal).toEqual({ studentId: 's1' });
    expect(broadcast.studentId).toBeNull();
    // Broadcast sub-filters null-or-match on class/district/board.
    const and = broadcast.AND as { OR: unknown[] }[];
    expect(and).toHaveLength(3);
    expect(and[0].OR).toEqual([{ targetClass: null }, { targetClass: '12' }]);
    expect(and[2].OR).toEqual([{ targetBoard: null }, { targetBoard: 'State Board' }]);
  });
});

describe('audienceStudentWhere', () => {
  it('scopes delivery per audience mode', () => {
    expect(audienceStudentWhere('ALL')).toEqual({});
    expect(audienceStudentWhere('CLASS', '12')).toEqual({ class: '12' });
    expect(audienceStudentWhere('DISTRICT', 'Salem')).toEqual({ district: 'Salem' });
    expect(audienceStudentWhere('BOARD', 'CBSE')).toEqual({ board: 'CBSE' });
    // Missing value → no scoping (delivers to nobody-specific → all).
    expect(audienceStudentWhere('CLASS')).toEqual({});
  });
});

describe('notificationStyle', () => {
  it('has an icon + colour for every type and a safe fallback', () => {
    for (const t of NOTIFICATION_TYPES) {
      const s = notificationStyle(t);
      expect(s.icon).toBeTruthy();
      expect(s.chip).toBeTruthy();
    }
    expect(notificationStyle('UNKNOWN').icon).toBeTruthy();
  });
});

describe('composeNotificationSchema', () => {
  const base = {
    type: 'OFFER',
    titleEn: 'Diwali offer',
    titleTa: 'தீபாவளி சலுகை',
    messageEn: 'Flat discount this week',
    messageTa: 'இந்த வாரம் தள்ளுபடி',
    audienceMode: 'ALL',
  };

  it('accepts a valid ALL broadcast', () => {
    expect(composeNotificationSchema.safeParse(base).success).toBe(true);
  });

  it('requires an audience value for CLASS/DISTRICT/BOARD', () => {
    const r = composeNotificationSchema.safeParse({ ...base, audienceMode: 'CLASS' });
    expect(r.success).toBe(false);
    expect(r.success ? '' : r.error.issues[0].message).toBe('audienceValueRequired');
    expect(composeNotificationSchema.safeParse({ ...base, audienceMode: 'CLASS', audienceValue: '12' }).success).toBe(true);
  });

  it('requires both languages', () => {
    expect(composeNotificationSchema.safeParse({ ...base, titleTa: '' }).success).toBe(false);
    expect(composeNotificationSchema.safeParse({ ...base, messageEn: '' }).success).toBe(false);
  });
});
