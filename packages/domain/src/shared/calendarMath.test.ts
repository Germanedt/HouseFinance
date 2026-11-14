import { describe, expect, it } from 'vitest';
import {
  daysInMonth,
  fromEpochDay,
  isLeapYear,
  isoDayOfWeek,
  isValidCivilDate,
  toEpochDay,
} from './calendarMath.js';

const MS_PER_DAY = 86_400_000;

/** Referencia externa solo para las pruebas: el dominio nunca usa `Date`. */
function referenceEpochDay(year: number, month: number, day: number): number {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return Math.round(date.getTime() / MS_PER_DAY);
}

describe('calendarMath', () => {
  describe('isLeapYear', () => {
    it.each([
      [2024, true],
      [2028, true],
      [2000, true],
      [2400, true],
      [2026, false],
      [1900, false],
      [2100, false],
    ])('%i is a leap year: %s', (year, expected) => {
      expect(isLeapYear(year)).toBe(expected);
    });
  });

  describe('daysInMonth', () => {
    it('knows months of 28, 29, 30 and 31 days', () => {
      expect(daysInMonth(2026, 2)).toBe(28);
      expect(daysInMonth(2028, 2)).toBe(29);
      expect(daysInMonth(2026, 4)).toBe(30);
      expect(daysInMonth(2026, 6)).toBe(30);
      expect(daysInMonth(2026, 9)).toBe(30);
      expect(daysInMonth(2026, 11)).toBe(30);
      expect(daysInMonth(2026, 1)).toBe(31);
      expect(daysInMonth(2026, 12)).toBe(31);
    });
  });

  describe('isValidCivilDate', () => {
    it('accepts existing dates and rejects the rest', () => {
      expect(isValidCivilDate({ year: 2028, month: 2, day: 29 })).toBe(true);
      expect(isValidCivilDate({ year: 2026, month: 2, day: 29 })).toBe(false);
      expect(isValidCivilDate({ year: 2026, month: 13, day: 1 })).toBe(false);
      expect(isValidCivilDate({ year: 2026, month: 1, day: 0 })).toBe(false);
      expect(isValidCivilDate({ year: 0, month: 1, day: 1 })).toBe(false);
      expect(isValidCivilDate({ year: 10000, month: 1, day: 1 })).toBe(false);
      expect(isValidCivilDate({ year: 2026, month: 1, day: 1.5 })).toBe(false);
    });
  });

  describe('epoch days', () => {
    it('anchors 1970-01-01 at day 0 (a Thursday)', () => {
      expect(toEpochDay({ year: 1970, month: 1, day: 1 })).toBe(0);
      expect(isoDayOfWeek(0)).toBe(4);
    });

    it('matches the reference calendar every day from 1900 to 2100, both ways', () => {
      const first = toEpochDay({ year: 1900, month: 1, day: 1 });
      const last = toEpochDay({ year: 2100, month: 12, day: 31 });
      for (let epochDay = first; epochDay <= last; epochDay += 1) {
        const civil = fromEpochDay(epochDay);
        expect(referenceEpochDay(civil.year, civil.month, civil.day)).toBe(epochDay);
        expect(toEpochDay(civil)).toBe(epochDay);
      }
    });

    it('matches the reference calendar at the limits of the supported years', () => {
      for (const [year, month, day] of [
        [1, 1, 1],
        [9999, 12, 31],
      ] as const) {
        const epochDay = toEpochDay({ year, month, day });
        expect(epochDay).toBe(referenceEpochDay(year, month, day));
        expect(fromEpochDay(epochDay)).toEqual({ year, month, day });
      }
    });

    it('computes the ISO day of the week, also before 1970', () => {
      // 2026-11-16 es lunes y 2026-11-15, domingo.
      expect(isoDayOfWeek(toEpochDay({ year: 2026, month: 11, day: 16 }))).toBe(1);
      expect(isoDayOfWeek(toEpochDay({ year: 2026, month: 11, day: 15 }))).toBe(7);
      // 1969-12-29 fue lunes.
      expect(isoDayOfWeek(toEpochDay({ year: 1969, month: 12, day: 29 }))).toBe(1);
    });
  });
});
