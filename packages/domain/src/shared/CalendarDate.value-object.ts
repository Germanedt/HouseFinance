import {
  fromEpochDay,
  isoDayOfWeek,
  isValidCivilDate,
  isValidYear,
  padNumber,
  toEpochDay,
} from './calendarMath.js';
import { InvalidCalendarDateError } from './shared.errors.js';
import { YearMonth } from './YearMonth.value-object.js';

/** Día de la semana ISO: 1 = lunes … 7 = domingo. */
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Resultado de comparar dos fechas: -1 anterior, 0 igual, 1 posterior. */
export type CalendarComparison = -1 | 0 | 1;

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Fecha de calendario (día, mes y año) sin hora ni zona horaria, inmutable.
 * Toda la lógica usa enteros; nunca `Date`. "Hoy" lo da el puerto `Clock`.
 */
export class CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  /** Días desde el 1970-01-01: base para comparar, sumar días y el día de la semana. */
  private readonly epochDay: number;

  private constructor(year: number, month: number, day: number) {
    this.year = year;
    this.month = month;
    this.day = day;
    this.epochDay = toEpochDay({ year, month, day });
    Object.freeze(this);
  }

  /** Crea una fecha desde `YYYY-MM-DD`. Rechaza formatos incorrectos y fechas inexistentes. */
  static fromString(value: string): CalendarDate {
    const match = ISO_DATE_PATTERN.exec(value);
    if (match === null) {
      throw new InvalidCalendarDateError({ reason: 'INVALID_FORMAT', value });
    }
    const parts = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
    if (!isValidCivilDate(parts)) {
      throw new InvalidCalendarDateError({ reason: 'INVALID_DATE', value });
    }
    return new CalendarDate(parts.year, parts.month, parts.day);
  }

  /** Crea una fecha desde sus partes (mes 1–12). Rechaza fechas inexistentes. */
  static of(year: number, month: number, day: number): CalendarDate {
    if (!isValidCivilDate({ year, month, day })) {
      throw new InvalidCalendarDateError({
        reason: 'INVALID_DATE',
        value: `${padNumber(year, 4)}-${padNumber(month, 2)}-${padNumber(day, 2)}`,
      });
    }
    return new CalendarDate(year, month, day);
  }

  private static fromEpochDay(epochDay: number): CalendarDate {
    const { year, month, day } = fromEpochDay(epochDay);
    if (!isValidYear(year)) {
      throw new InvalidCalendarDateError({ reason: 'OUT_OF_RANGE', value: epochDay });
    }
    return new CalendarDate(year, month, day);
  }

  compareTo(other: CalendarDate): CalendarComparison {
    if (this.epochDay === other.epochDay) {
      return 0;
    }
    return this.epochDay > other.epochDay ? 1 : -1;
  }

  equals(other: CalendarDate): boolean {
    return this.epochDay === other.epochDay;
  }

  isBefore(other: CalendarDate): boolean {
    return this.epochDay < other.epochDay;
  }

  isAfter(other: CalendarDate): boolean {
    return this.epochDay > other.epochDay;
  }

  /** Suma días (un número negativo resta). Fuera de los años 0001–9999 lanza `OUT_OF_RANGE`. */
  addDays(days: number): CalendarDate {
    if (!Number.isSafeInteger(days)) {
      throw new InvalidCalendarDateError({ reason: 'OUT_OF_RANGE', value: days });
    }
    return CalendarDate.fromEpochDay(this.epochDay + days);
  }

  /** Días desde esta fecha hasta `other` (negativo si `other` es anterior). */
  daysUntil(other: CalendarDate): number {
    return other.epochDay - this.epochDay;
  }

  dayOfWeek(): DayOfWeek {
    // isoDayOfWeek siempre devuelve un entero entre 1 y 7.
    return isoDayOfWeek(this.epochDay) as DayOfWeek;
  }

  /** De lunes a viernes. Los festivos los decide `HolidayCalendar`, no esta clase. */
  isWeekday(): boolean {
    return this.dayOfWeek() <= 5;
  }

  yearMonth(): YearMonth {
    return YearMonth.of(this.year, this.month);
  }

  firstDayOfMonth(): CalendarDate {
    return this.yearMonth().firstDay();
  }

  lastDayOfMonth(): CalendarDate {
    return this.yearMonth().lastDay();
  }

  /** `YYYY-MM-DD`, el formato de contratos y base de datos. */
  toString(): string {
    return `${padNumber(this.year, 4)}-${padNumber(this.month, 2)}-${padNumber(this.day, 2)}`;
  }
}
