import { describe, expect, it } from 'vitest';
import { DomainError, ValidationError } from './DomainError.js';
import { InvalidYearMonthError, type InvalidCalendarFieldCode } from './shared.errors.js';
import { YearMonth } from './YearMonth.value-object.js';

function month(value: string): YearMonth {
  return YearMonth.fromString(value);
}

function captureError(action: () => unknown): unknown {
  try {
    action();
  } catch (error: unknown) {
    return error;
  }
  throw new Error('Expected the action to throw');
}

function expectInvalidYearMonth(
  action: () => unknown,
  code: InvalidCalendarFieldCode,
  path: 'yearMonth' | 'months' | 'day' = 'yearMonth',
): void {
  const error = captureError(action);
  expect(error).toBeInstanceOf(InvalidYearMonthError);
  expect(error).toBeInstanceOf(ValidationError);
  expect(error).toBeInstanceOf(DomainError);
  expect(error).toMatchObject({ code: 'VALIDATION_ERROR', fields: [{ path, code }] });
}

describe('YearMonth', () => {
  describe('fromString', () => {
    it('creates a month from YYYY-MM', () => {
      const created = month('2026-11');
      expect([created.year, created.month]).toEqual([2026, 11]);
      expect(created.toString()).toBe('2026-11');
    });

    it.each(['2026-13', '2026-00', '0000-01'])('rejects the nonexistent month %s', (value) => {
      expectInvalidYearMonth(() => month(value), 'INVALID_DATE');
    });

    it.each(['2026-1', '11-2026', '2026-11-01', '2026/11', ''])(
      'rejects the format %j',
      (value) => {
        expectInvalidYearMonth(() => month(value), 'INVALID_FORMAT');
      },
    );
  });

  describe('of', () => {
    it('creates a month from its parts', () => {
      expect(YearMonth.of(2026, 1).toString()).toBe('2026-01');
    });

    it('rejects nonexistent months', () => {
      expectInvalidYearMonth(() => YearMonth.of(2026, 13), 'INVALID_DATE');
    });
  });

  it('is immutable', () => {
    const value = month('2026-11');
    expect(Object.isFrozen(value)).toBe(true);
    expect(() => {
      Object.assign(value, { month: 1 });
    }).toThrow(TypeError);
  });

  describe('comparison', () => {
    it('compares months, also across years', () => {
      expect(month('2026-11').compareTo(month('2026-12'))).toBe(-1);
      expect(month('2027-01').compareTo(month('2026-12'))).toBe(1);
      expect(month('2026-11').compareTo(month('2026-11'))).toBe(0);
      expect(month('2026-12').isBefore(month('2027-01'))).toBe(true);
      expect(month('2026-12').isBefore(month('2026-12'))).toBe(false);
      expect(month('2027-01').isAfter(month('2026-12'))).toBe(true);
      expect(month('2027-01').isAfter(month('2027-01'))).toBe(false);
      expect(month('2026-11').equals(month('2026-11'))).toBe(true);
      expect(month('2026-11').equals(month('2026-10'))).toBe(false);
    });
  });

  describe('addMonths', () => {
    it('adds months within the year and across years', () => {
      expect(month('2026-01').addMonths(1).toString()).toBe('2026-02');
      expect(month('2026-11').addMonths(2).toString()).toBe('2027-01');
      expect(month('2026-12').addMonths(1).toString()).toBe('2027-01');
      expect(month('2026-01').addMonths(12).toString()).toBe('2027-01');
      expect(month('2026-03').addMonths(25).toString()).toBe('2028-04');
    });

    it('subtracts with negative months', () => {
      expect(month('2027-01').addMonths(-1).toString()).toBe('2026-12');
      expect(month('2026-03').addMonths(-15).toString()).toBe('2024-12');
    });

    it('keeps the original month', () => {
      const original = month('2026-11');
      expect(original.addMonths(0).equals(original)).toBe(true);
      expect(original.toString()).toBe('2026-11');
    });

    it('rejects non-integer months and months beyond the supported years', () => {
      expectInvalidYearMonth(() => month('2026-11').addMonths(0.5), 'OUT_OF_RANGE', 'months');
      expectInvalidYearMonth(() => month('9999-12').addMonths(1), 'OUT_OF_RANGE', 'months');
      expectInvalidYearMonth(() => month('0001-01').addMonths(-1), 'OUT_OF_RANGE', 'months');
    });
  });

  describe('monthsUntil', () => {
    it('counts the months to another month, for the frequency', () => {
      expect(month('2026-11').monthsUntil(month('2026-11'))).toBe(0);
      expect(month('2026-11').monthsUntil(month('2027-02'))).toBe(3);
      expect(month('2026-01').monthsUntil(month('2027-01'))).toBe(12);
      expect(month('2026-11').monthsUntil(month('2026-05'))).toBe(-6);
    });

    it('lets a quarterly obligation know its billing months', () => {
      const firstBillMonth = month('2026-11');
      const billedMonths = [0, 1, 2, 3, 4, 5, 6, 7]
        .map((offset) => firstBillMonth.addMonths(offset))
        .filter((candidate) => firstBillMonth.monthsUntil(candidate) % 3 === 0)
        .map((candidate) => candidate.toString());
      expect(billedMonths).toEqual(['2026-11', '2027-02', '2027-05']);
    });
  });

  describe('days', () => {
    it.each([
      ['2026-02', 28, '2026-02-28'],
      ['2028-02', 29, '2028-02-29'],
      ['2100-02', 28, '2100-02-28'],
      ['2000-02', 29, '2000-02-29'],
      ['2026-04', 30, '2026-04-30'],
      ['2026-12', 31, '2026-12-31'],
    ])('%s has %i days and ends on %s', (value, days, last) => {
      expect(month(value).daysInMonth()).toBe(days);
      expect(month(value).firstDay().toString()).toBe(`${value}-01`);
      expect(month(value).lastDay().toString()).toBe(last);
    });

    it('gives its day N between 1 and 28', () => {
      expect(month('2026-02').atDay(1).toString()).toBe('2026-02-01');
      expect(month('2026-02').atDay(28).toString()).toBe('2026-02-28');
      expect(month('2026-11').atDay(15).toString()).toBe('2026-11-15');
    });

    it.each([0, 29, 31, 1.5])('rejects day %s', (day) => {
      expectInvalidYearMonth(() => month('2026-03').atDay(day), 'OUT_OF_RANGE', 'day');
    });
  });
});
