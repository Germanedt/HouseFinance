import { describe, expect, it } from 'vitest';
import { CalendarDate } from './CalendarDate.value-object.js';
import { DomainError, ValidationError } from './DomainError.js';
import { InvalidCalendarDateError, type InvalidCalendarFieldCode } from './shared.errors.js';

function date(value: string): CalendarDate {
  return CalendarDate.fromString(value);
}

function captureError(action: () => unknown): unknown {
  try {
    action();
  } catch (error: unknown) {
    return error;
  }
  throw new Error('Expected the action to throw');
}

function expectInvalidDate(
  action: () => unknown,
  code: InvalidCalendarFieldCode,
  path: 'date' | 'days' = 'date',
): void {
  const error = captureError(action);
  expect(error).toBeInstanceOf(InvalidCalendarDateError);
  expect(error).toBeInstanceOf(ValidationError);
  expect(error).toBeInstanceOf(DomainError);
  expect(error).toMatchObject({ code: 'VALIDATION_ERROR', fields: [{ path, code }] });
}

describe('CalendarDate', () => {
  describe('fromString', () => {
    it('creates a date from YYYY-MM-DD', () => {
      const created = date('2026-10-30');
      expect([created.year, created.month, created.day]).toEqual([2026, 10, 30]);
      expect(created.toString()).toBe('2026-10-30');
    });

    it('accepts February 29 only in leap years', () => {
      expect(date('2028-02-29').toString()).toBe('2028-02-29');
      expect(date('2000-02-29').toString()).toBe('2000-02-29');
      expectInvalidDate(() => date('2026-02-29'), 'INVALID_DATE');
      expectInvalidDate(() => date('2100-02-29'), 'INVALID_DATE');
    });

    it.each(['2026-02-30', '2026-04-31', '2026-13-01', '2026-00-10', '2026-01-00', '0000-01-01'])(
      'rejects the nonexistent date %s',
      (value) => {
        expectInvalidDate(() => date(value), 'INVALID_DATE');
      },
    );

    it.each(['30-10-2026', '2026-1-05', '2026/01/05', '2026-01-05T00:00:00Z', '', ' 2026-01-05'])(
      'rejects the format %j',
      (value) => {
        expectInvalidDate(() => date(value), 'INVALID_FORMAT');
      },
    );
  });

  describe('of', () => {
    it('creates a date from its parts', () => {
      expect(CalendarDate.of(2026, 1, 5).toString()).toBe('2026-01-05');
      expect(CalendarDate.of(1, 1, 1).toString()).toBe('0001-01-01');
    });

    it('rejects nonexistent dates', () => {
      expectInvalidDate(() => CalendarDate.of(2026, 2, 30), 'INVALID_DATE');
    });
  });

  it('is immutable', () => {
    const value = date('2026-10-30');
    expect(Object.isFrozen(value)).toBe(true);
    expect(() => {
      Object.assign(value, { day: 1 });
    }).toThrow(TypeError);
  });

  describe('comparison', () => {
    it('compares dates, also across months and years', () => {
      expect(date('2026-10-30').compareTo(date('2026-10-31'))).toBe(-1);
      expect(date('2027-01-01').compareTo(date('2026-12-31'))).toBe(1);
      expect(date('2026-10-30').compareTo(date('2026-10-30'))).toBe(0);
    });

    it('tells whether a date is before, after or equal to another', () => {
      expect(date('2026-12-31').isBefore(date('2027-01-01'))).toBe(true);
      expect(date('2026-12-31').isBefore(date('2026-12-31'))).toBe(false);
      expect(date('2027-01-01').isAfter(date('2026-12-31'))).toBe(true);
      expect(date('2027-01-01').isAfter(date('2027-01-01'))).toBe(false);
      expect(date('2026-10-30').equals(date('2026-10-30'))).toBe(true);
      expect(date('2026-10-30').equals(date('2026-10-31'))).toBe(false);
    });
  });

  describe('addDays', () => {
    it('adds days within the month', () => {
      expect(date('2026-10-01').addDays(29).toString()).toBe('2026-10-30');
    });

    it('crosses months of 28, 29, 30 and 31 days', () => {
      expect(date('2026-02-28').addDays(1).toString()).toBe('2026-03-01');
      expect(date('2028-02-28').addDays(1).toString()).toBe('2028-02-29');
      expect(date('2028-02-29').addDays(1).toString()).toBe('2028-03-01');
      expect(date('2026-04-30').addDays(1).toString()).toBe('2026-05-01');
      expect(date('2026-01-31').addDays(1).toString()).toBe('2026-02-01');
    });

    it('crosses the year', () => {
      expect(date('2026-12-31').addDays(1).toString()).toBe('2027-01-01');
      expect(date('2026-12-25').addDays(7).toString()).toBe('2027-01-01');
    });

    it('subtracts with negative days', () => {
      expect(date('2027-01-01').addDays(-1).toString()).toBe('2026-12-31');
      expect(date('2028-03-01').addDays(-1).toString()).toBe('2028-02-29');
    });

    it('adds a whole leap and non-leap year', () => {
      expect(date('2028-01-01').addDays(366).toString()).toBe('2029-01-01');
      expect(date('2026-01-01').addDays(365).toString()).toBe('2027-01-01');
    });

    it('returns a new date and keeps the original', () => {
      const original = date('2026-10-30');
      expect(original.addDays(0).equals(original)).toBe(true);
      expect(original.addDays(1)).not.toBe(original);
      expect(original.toString()).toBe('2026-10-30');
    });

    it('rejects non-integer days and dates beyond the supported years', () => {
      expectInvalidDate(() => date('2026-10-30').addDays(1.5), 'OUT_OF_RANGE', 'days');
      expectInvalidDate(() => date('9999-12-31').addDays(1), 'OUT_OF_RANGE', 'days');
      expectInvalidDate(() => date('0001-01-01').addDays(-1), 'OUT_OF_RANGE', 'days');
    });
  });

  describe('daysUntil', () => {
    it('counts the days to another date', () => {
      expect(date('2026-11-14').daysUntil(date('2026-11-21'))).toBe(7);
      expect(date('2026-12-31').daysUntil(date('2027-01-01'))).toBe(1);
      expect(date('2028-02-01').daysUntil(date('2028-03-01'))).toBe(29);
      expect(date('2026-11-21').daysUntil(date('2026-11-14'))).toBe(-7);
    });
  });

  describe('day of the week', () => {
    it('returns the ISO day of the week (1 = Monday … 7 = Sunday)', () => {
      expect(date('2026-11-16').dayOfWeek()).toBe(1);
      expect(date('2026-11-20').dayOfWeek()).toBe(5);
      expect(date('2026-11-21').dayOfWeek()).toBe(6);
      expect(date('2026-11-22').dayOfWeek()).toBe(7);
      // Un 29 de febrero y un cambio de año.
      expect(date('2028-02-29').dayOfWeek()).toBe(2);
      expect(date('2027-01-01').dayOfWeek()).toBe(5);
    });

    it('tells whether the date falls from Monday to Friday', () => {
      expect(date('2026-11-16').isWeekday()).toBe(true);
      expect(date('2026-11-20').isWeekday()).toBe(true);
      expect(date('2026-11-21').isWeekday()).toBe(false);
      expect(date('2026-11-22').isWeekday()).toBe(false);
    });
  });

  describe('month boundaries', () => {
    it.each([
      ['2026-02-14', '2026-02-01', '2026-02-28'],
      ['2028-02-14', '2028-02-01', '2028-02-29'],
      ['2026-04-15', '2026-04-01', '2026-04-30'],
      ['2026-12-31', '2026-12-01', '2026-12-31'],
      ['2026-01-01', '2026-01-01', '2026-01-31'],
    ])('%s is in a month from %s to %s', (value, first, last) => {
      expect(date(value).firstDayOfMonth().toString()).toBe(first);
      expect(date(value).lastDayOfMonth().toString()).toBe(last);
    });

    it('gives its YearMonth', () => {
      expect(date('2026-10-30').yearMonth().toString()).toBe('2026-10');
    });
  });
});
