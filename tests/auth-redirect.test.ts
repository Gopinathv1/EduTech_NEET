import { describe, expect, it } from 'vitest';
import { safeAuthReturnPath, safeReturnPath, withReturnParam } from '@/lib/auth/redirect';

describe('auth redirect helpers', () => {
  it('allows local return paths with query strings', () => {
    expect(safeReturnPath('/marketplace?category=books')).toBe('/marketplace?category=books');
  });

  it.each(['https://evil.test/courses', '//evil.test/courses', 'courses', ''])(
    'falls back for unsafe return path %s',
    (value) => {
      expect(safeReturnPath(value)).toBe('/student');
    },
  );

  it('encodes a safe callbackUrl onto an internal auth path', () => {
    expect(withReturnParam('/complete-profile', '/courses?tab=ai')).toBe(
      '/complete-profile?callbackUrl=%2Fcourses%3Ftab%3Dai',
    );
  });

  it('normalizes NextAuth same-origin absolute callback URLs', () => {
    expect(
      safeAuthReturnPath(
        'http://localhost:3000/exam-preparation?mode=guided',
        '/student',
        'http://localhost:3000',
      ),
    ).toBe('/exam-preparation?mode=guided');
  });

  it('rejects absolute callback URLs from another origin', () => {
    expect(
      safeAuthReturnPath(
        'https://evil.test/exam-preparation',
        '/student',
        'http://localhost:3000',
      ),
    ).toBe('/student');
  });
});
