import { CalendarDate, type CalendarComparison } from './CalendarDate.value-object.js';
import { daysInMonth, isValidMonth, isValidYear, padNumber } from './calendarMath.js';
import { InvalidYearMonthError } from './shared.errors.js';

const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

/** Primer y último día N que se puede pedir: todos los meses lo tienen (regla de día fijo 1–28). */
const MIN_DAY_OF_MONTH = 1;
const MAX_DAY_OF_MONTH = 28;

/**
 * Mes de un año (`YYYY-MM`), inmutable. Sirve para periodos de recibos, el mes del primer
 * recibo (`firstBillMonth`) y la periodicidad.
 */
export class YearMonth {
  readonly year: number;
  readonly month: number;
  /** Meses desde el año 0: base para comparar, sumar y restar meses. */
  private readonly monthIndex: number;

  private constructor(year: number, month: number) {
    this.year = year;
    this.month = month;
    this.monthIndex = year * 12 + (month - 1);
    Object.freeze(this);
  }

  /** Crea un mes desde `YYYY-MM`. Rechaza formatos incorrectos y meses inexistentes. */
  static fromString(value: string): YearMonth {
    const match = YEAR_MONTH_PATTERN.exec(value);
    if (match === null) {
      throw new InvalidYearMonthError({ reason: 'INVALID_FORMAT', value });
    }
    const parts = { year: Number(match[1]), month: Number(match[2]) };
    if (!isValidYear(parts.year) || !isValidMonth(parts.month)) {
      throw new InvalidYearMonthError({ reason: 'INVALID_DATE', value });
    }
    return new YearMonth(parts.year, parts.month);
  }

  /** Crea un mes desde sus partes (mes 1–12). */
  static of(year: number, month: number): YearMonth {
    if (!isValidYear(year) || !isValidMonth(month)) {
      throw new InvalidYearMonthError({
        reason: 'INVALID_DATE',
        value: `${padNumber(year, 4)}-${padNumber(month, 2)}`,
      });
    }
    return new YearMonth(year, month);
  }

  compareTo(other: YearMonth): CalendarComparison {
    if (this.monthIndex === other.monthIndex) {
      return 0;
    }
    return this.monthIndex > other.monthIndex ? 1 : -1;
  }

  equals(other: YearMonth): boolean {
    return this.monthIndex === other.monthIndex;
  }

  isBefore(other: YearMonth): boolean {
    return this.monthIndex < other.monthIndex;
  }

  isAfter(other: YearMonth): boolean {
    return this.monthIndex > other.monthIndex;
  }

  /** Suma meses (un número negativo resta). Fuera de los años 0001–9999 lanza `OUT_OF_RANGE`. */
  addMonths(months: number): YearMonth {
    if (!Number.isSafeInteger(months)) {
      throw new InvalidYearMonthError({ reason: 'OUT_OF_RANGE', value: months });
    }
    const index = this.monthIndex + months;
    const year = Math.floor(index / 12);
    if (!isValidYear(year)) {
      throw new InvalidYearMonthError({ reason: 'OUT_OF_RANGE', value: months });
    }
    return new YearMonth(year, index - year * 12 + 1);
  }

  /**
   * Meses desde este mes hasta `other` (negativo si `other` es anterior).
   * Para la periodicidad: toca recibo si `firstBillMonth.monthsUntil(mes)` es múltiplo de 1, 2, 3, 6 o 12.
   */
  monthsUntil(other: YearMonth): number {
    return other.monthIndex - this.monthIndex;
  }

  daysInMonth(): number {
    return daysInMonth(this.year, this.month);
  }

  /** Su día N, entre 1 y 28 (los días que existen en todos los meses). */
  atDay(day: number): CalendarDate {
    if (!Number.isInteger(day) || day < MIN_DAY_OF_MONTH || day > MAX_DAY_OF_MONTH) {
      throw new InvalidYearMonthError({ reason: 'OUT_OF_RANGE', value: day });
    }
    return CalendarDate.of(this.year, this.month, day);
  }

  firstDay(): CalendarDate {
    return CalendarDate.of(this.year, this.month, 1);
  }

  lastDay(): CalendarDate {
    return CalendarDate.of(this.year, this.month, this.daysInMonth());
  }

  /** `YYYY-MM`, el formato de los contratos. */
  toString(): string {
    return `${padNumber(this.year, 4)}-${padNumber(this.month, 2)}`;
  }
}
