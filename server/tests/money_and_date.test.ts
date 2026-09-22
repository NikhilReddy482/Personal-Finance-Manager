import { describe, it, expect } from 'vitest';
import { toMinorUnits, toMajorUnits, formatCurrency } from '../src/utils/money';
import { parseFinancialDate, formatDateISO, getMonthKey } from '../src/utils/date';

describe('Money Utilities (Minor Units / Paise)', () => {
  it('correctly converts major units to minor integer units without float errors', () => {
    expect(toMinorUnits(420.50)).toBe(42050);
    expect(toMinorUnits(0.1 + 0.2)).toBe(30);
    expect(toMinorUnits(99.99)).toBe(9999);
  });

  it('correctly converts minor units back to major units', () => {
    expect(toMajorUnits(42050)).toBe(420.5);
    expect(toMajorUnits(9999)).toBe(99.99);
    expect(toMajorUnits(0)).toBe(0);
  });

  it('formats currency correctly', () => {
    const formatted = formatCurrency(42050, 'INR', 'en-IN');
    expect(formatted).toContain('420.50');
  });
});

describe('Date Utilities & Multi-format Normalizer', () => {
  it('parses ISO dates (YYYY-MM-DD)', () => {
    const d = parseFinancialDate('2024-10-15');
    expect(d).not.toBeNull();
    expect(formatDateISO(d!)).toBe('2024-10-15');
    expect(getMonthKey(d!)).toBe('2024-10');
  });

  it('parses standard Indian bank dates (DD/MM/YYYY)', () => {
    const d = parseFinancialDate('15/10/2024');
    expect(d).not.toBeNull();
    expect(formatDateISO(d!)).toBe('2024-10-15');
  });

  it('parses alphanumeric dates (15-Oct-2024)', () => {
    const d = parseFinancialDate('15-Oct-2024');
    expect(d).not.toBeNull();
    expect(formatDateISO(d!)).toBe('2024-10-15');
  });
});
