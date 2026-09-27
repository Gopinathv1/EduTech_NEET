import { describe, expect, it } from 'vitest';
import { isExactFixedNeetSelection, summarizeFixedNeetSelection } from '@/lib/admin/fixed-neet-full-mock';

describe('fixed NEET full mock selection', () => {
  it('accepts 45 Physics, 45 Chemistry, and combined 90 Biology without imposing a Botany/Zoology split', () => {
    const subjects = [...Array(45).fill('PHYSICS'), ...Array(45).fill('CHEMISTRY'), ...Array(48).fill('BOTANY'), ...Array(42).fill('ZOOLOGY')];
    const rows = subjects.map((subjectCode, index) => ({ id: `q-${index}`, externalId: `id-${index}`, subjectCode, approved: true, activeEligible: true }));
    const summary = summarizeFixedNeetSelection(rows);
    expect(summary).toMatchObject({ total: 180, unique: 180, physics: 45, chemistry: 45, biology: 90, botany: 48, zoology: 42 });
    expect(isExactFixedNeetSelection(summary)).toBe(true);
  });
});
