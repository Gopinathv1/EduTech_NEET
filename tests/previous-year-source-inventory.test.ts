import { describe, expect, it } from 'vitest';
import {
  officialSourceInventory,
  PREVIOUS_YEAR_MODES,
  PREVIOUS_YEAR_WINDOW,
  sourceInventoryFor,
  totalVerifiedQuestions,
  validateOfficialSourceInventory,
} from '@/lib/previous-year/source-inventory';

describe('Phase 2 official source inventory', () => {
  it('contains exactly the five targeted years for both exams on official hosts', () => {
    expect(validateOfficialSourceInventory(officialSourceInventory)).toEqual([]);
    for (const exam of ['NEET', 'JEE'] as const) {
      expect(sourceInventoryFor(exam).map((record) => record.year).sort()).toEqual([...PREVIOUS_YEAR_WINDOW]);
    }
  });

  it('does not turn answer-key-only records into publishable questions', () => {
    expect(totalVerifiedQuestions('NEET')).toBe(0);
    expect(totalVerifiedQuestions('JEE')).toBe(0);
    expect(officialSourceInventory.every((record) => record.paperAvailability === 'UNAVAILABLE')).toBe(true);
  });

  it('exposes only the three authorized Phase 2 modes', () => {
    expect(PREVIOUS_YEAR_MODES).toEqual(['YEAR_WISE', 'MIXED_FIVE_YEARS', 'SUBJECT_CHAPTER']);
  });
});
