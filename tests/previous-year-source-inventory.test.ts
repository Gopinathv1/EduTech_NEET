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
  it('contains exactly the thirteen targeted years for both exams on official hosts', () => {
    expect(validateOfficialSourceInventory(officialSourceInventory)).toEqual([]);
    for (const exam of ['NEET', 'JEE'] as const) {
      expect(sourceInventoryFor(exam).map((record) => record.year).sort()).toEqual([...PREVIOUS_YEAR_WINDOW]);
    }
  });

  it('counts only the explicitly validated NEET historical subset', () => {
    expect(totalVerifiedQuestions('NEET')).toBe(780);
    expect(totalVerifiedQuestions('JEE')).toBe(0);
    expect(officialSourceInventory.find((record) => record.exam === 'NEET' && record.year === 2020)?.paperAvailability).toBe('AVAILABLE');
    expect(officialSourceInventory.find((record) => record.exam === 'NEET' && record.year === 2020)?.verifiedQuestionCount).toBe(0);
    expect(officialSourceInventory.filter((record) => record.exam === 'NEET' && record.year >= 2021).every((record) => record.paperAvailability === 'PARTIAL' && record.verifiedQuestionCount > 0)).toBe(true);
  });

  it('exposes only the three authorized Phase 2 modes', () => {
    expect(PREVIOUS_YEAR_MODES).toEqual(['YEAR_WISE', 'MIXED_FIVE_YEARS', 'SUBJECT_CHAPTER']);
  });
});
