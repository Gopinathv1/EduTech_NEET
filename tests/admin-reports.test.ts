import { describe, it, expect } from 'vitest';
import { parseRange, eachDay, fillSeries, parsePage, totalPages, pct, dateKey } from '@/lib/admin/reports/util';
import { realDifficultyFromAccuracy, difficultyContradiction } from '@/lib/admin/reports/difficulty';
import { buildStudentWhere } from '@/lib/admin/students-filter';

describe('report util — date range', () => {
  it('defaults to the last N days when no params', () => {
    const { from, to } = parseRange(undefined, undefined, 30);
    expect(from.getHours()).toBe(0);
    expect(to.getHours()).toBe(23);
    const days = Math.round((to.getTime() - from.getTime()) / (24 * 3600 * 1000));
    expect(days).toBe(30); // 30-day span (29 full days + partial)
  });

  it('honours explicit from/to', () => {
    const { from, to } = parseRange('2026-01-01', '2026-01-31');
    expect(dateKey(from)).toBe('2026-01-01');
    expect(dateKey(to)).toBe('2026-01-31');
  });
});

describe('report util — day series', () => {
  it('eachDay is inclusive', () => {
    expect(eachDay(new Date('2026-03-01'), new Date('2026-03-03'))).toEqual(['2026-03-01', '2026-03-02', '2026-03-03']);
  });

  it('fillSeries fills gaps with zero', () => {
    const m = new Map([['2026-03-02', 5]]);
    const s = fillSeries(new Date('2026-03-01'), new Date('2026-03-03'), m);
    expect(s).toEqual([
      { date: '2026-03-01', value: 0 },
      { date: '2026-03-02', value: 5 },
      { date: '2026-03-03', value: 0 },
    ]);
  });
});

describe('report util — pagination + pct', () => {
  it('parsePage clamps to page 1 and computes skip', () => {
    expect(parsePage('3', 25)).toEqual({ page: 3, perPage: 25, skip: 50, take: 25 });
    expect(parsePage('0', 25).page).toBe(1);
    expect(parsePage('abc', 25).page).toBe(1);
  });
  it('totalPages and pct', () => {
    expect(totalPages(0, 25)).toBe(1);
    expect(totalPages(26, 25)).toBe(2);
    expect(pct(1, 4)).toBe(25);
    expect(pct(1, 0)).toBe(0);
  });
});

describe('question difficulty flagging', () => {
  it('bands accuracy into difficulty', () => {
    expect(realDifficultyFromAccuracy(85)).toBe('EASY');
    expect(realDifficultyFromAccuracy(55)).toBe('MEDIUM');
    expect(realDifficultyFromAccuracy(20)).toBe('HARD');
  });

  it('flags a contradiction only with enough answers', () => {
    // Labelled EASY but only 20% get it right → real HARD → contradiction.
    expect(difficultyContradiction('EASY', 20, 15)).toBe(true);
    // Same but too few answers → not flagged.
    expect(difficultyContradiction('EASY', 20, 5)).toBe(false);
    // Label matches observed band → no flag.
    expect(difficultyContradiction('HARD', 20, 15)).toBe(false);
  });
});

describe('buildStudentWhere', () => {
  it('is empty for no filters', () => {
    expect(buildStudentWhere({})).toEqual({});
  });
  it('filters by district/board/class and date', () => {
    const w = buildStudentWhere({ district: 'Chennai', board: 'CBSE', klass: '12', from: '2026-01-01' });
    expect(w.district).toBe('Chennai');
    expect(w.board).toBe('CBSE');
    expect(w.class).toBe('12');
    expect((w.createdAt as { gte?: Date }).gte).toBeInstanceOf(Date);
  });
  it('searches phone digits only when long enough', () => {
    expect(JSON.stringify(buildStudentWhere({ q: 'Ab' }))).not.toContain('mobile');
    expect(JSON.stringify(buildStudentWhere({ q: '98765' }))).toContain('mobile');
  });
});
