import { describe, it, expect, afterEach } from 'vitest';
import {
  shouldShowAdmissionBanner,
  admissionScoreCutoff,
  leadStudentStepIndex,
} from '@/lib/admission/config';
import { buildLeadWhere } from '@/lib/admin/leads-filter';
import { admissionLeadSchema } from '@/lib/validation/admission';

describe('admissionScoreCutoff', () => {
  const original = process.env.ADMISSION_SCORE_CUTOFF;
  afterEach(() => {
    if (original === undefined) delete process.env.ADMISSION_SCORE_CUTOFF;
    else process.env.ADMISSION_SCORE_CUTOFF = original;
  });

  it('defaults to 450 and reads a valid env override', () => {
    delete process.env.ADMISSION_SCORE_CUTOFF;
    expect(admissionScoreCutoff()).toBe(450);
    process.env.ADMISSION_SCORE_CUTOFF = '520';
    expect(admissionScoreCutoff()).toBe(520);
    process.env.ADMISSION_SCORE_CUTOFF = 'nonsense';
    expect(admissionScoreCutoff()).toBe(450);
  });
});

describe('shouldShowAdmissionBanner', () => {
  it('shows only for a full test below the cutoff', () => {
    expect(shouldShowAdmissionBanner({ testType: 'FULL_TEST', score: 300, cutoff: 450 })).toBe(true);
    expect(shouldShowAdmissionBanner({ testType: 'FULL_TEST', score: 450, cutoff: 450 })).toBe(false); // not below
    expect(shouldShowAdmissionBanner({ testType: 'FULL_TEST', score: 600, cutoff: 450 })).toBe(false);
    expect(shouldShowAdmissionBanner({ testType: 'CHAPTER_TEST', score: 10, cutoff: 450 })).toBe(false);
  });
});

describe('leadStudentStepIndex', () => {
  it('maps status to the 3-step tracker', () => {
    expect(leadStudentStepIndex('NEW')).toBe(0);
    expect(leadStudentStepIndex('IN_PROGRESS')).toBe(1);
    expect(leadStudentStepIndex('CONTACTED')).toBe(2);
    expect(leadStudentStepIndex('CONVERTED')).toBe(2);
    expect(leadStudentStepIndex('CLOSED')).toBe(2);
  });
});

describe('buildLeadWhere', () => {
  it('is empty for no filters', () => {
    expect(buildLeadWhere({})).toEqual({});
  });

  it('filters by status, budget and score range', () => {
    const w = buildLeadWhere({ status: 'NEW', budget: 'B15_25', scoreMin: '200', scoreMax: '500' });
    expect(w.status).toBe('NEW');
    expect(w.budget).toBe('B15_25');
    expect(w.neetScore).toEqual({ gte: 200, lte: 500 });
  });

  it('ignores unknown status / budget values', () => {
    const w = buildLeadWhere({ status: 'BOGUS', budget: 'XYZ' });
    expect(w.status).toBeUndefined();
    expect(w.budget).toBeUndefined();
  });

  it('matches a country against primary or multi-select', () => {
    const w = buildLeadWhere({ countryId: 'c1' });
    expect(w.OR).toEqual([{ interestedCountryId: 'c1' }, { interestedCountryIds: { has: 'c1' } }]);
  });

  it('combines a country filter and a text search with AND', () => {
    const w = buildLeadWhere({ countryId: 'c1', q: 'Ravi' });
    expect(w.OR).toBeUndefined();
    expect(Array.isArray(w.AND)).toBe(true);
    expect((w.AND as unknown[]).length).toBe(2);
  });

  it('searches phone digits only when long enough', () => {
    const short = buildLeadWhere({ q: 'Ra' });
    expect(JSON.stringify(short)).not.toContain('mobile');
    const long = buildLeadWhere({ q: '98765' });
    expect(JSON.stringify(long)).toContain('mobile');
    expect(JSON.stringify(long)).toContain('parentContact');
  });
});

describe('admissionLeadSchema', () => {
  const valid = {
    neetScore: 320,
    marks: 320,
    category: 'OBC',
    budget: 'B15_25',
    interestedCountryIds: ['c1', 'c2'],
    parentContact: '9876543210',
    consent: true,
  };

  it('accepts a valid lead', () => {
    const r = admissionLeadSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it('requires consent to be true', () => {
    const r = admissionLeadSchema.safeParse({ ...valid, consent: false });
    expect(r.success).toBe(false);
    expect(r.success ? '' : r.error.issues[0].message).toBe('consentRequired');
  });

  it('requires at least one country', () => {
    const r = admissionLeadSchema.safeParse({ ...valid, interestedCountryIds: [] });
    expect(r.success).toBe(false);
    expect(r.success ? '' : r.error.issues[0].message).toBe('countryRequired');
  });

  it('rejects an out-of-range score and coerces empty to undefined', () => {
    expect(admissionLeadSchema.safeParse({ ...valid, neetScore: 900 }).success).toBe(false);
    const r = admissionLeadSchema.safeParse({ ...valid, neetScore: '', marks: '' });
    expect(r.success).toBe(true);
    expect(r.success && r.data.neetScore).toBeUndefined();
  });
});
