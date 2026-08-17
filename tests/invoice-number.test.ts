import { describe, it, expect } from 'vitest';
import { formatInvoiceNumber } from '@/lib/payments/service';

describe('formatInvoiceNumber', () => {
  it('zero-pads the sequence to 5 digits and prefixes the year', () => {
    expect(formatInvoiceNumber(2026, 1)).toBe('INV-2026-00001');
    expect(formatInvoiceNumber(2026, 42)).toBe('INV-2026-00042');
    expect(formatInvoiceNumber(2026, 99999)).toBe('INV-2026-99999');
  });

  it('does not truncate sequences beyond 5 digits', () => {
    expect(formatInvoiceNumber(2026, 100000)).toBe('INV-2026-100000');
  });

  it('uses the given year (per-year counter)', () => {
    expect(formatInvoiceNumber(2027, 1)).toBe('INV-2027-00001');
  });
});
