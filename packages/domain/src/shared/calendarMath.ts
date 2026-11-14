// Aritmética del calendario gregoriano con enteros, sin `Date` ni zonas horarias.
// Uso interno de CalendarDate y YearMonth; no forma parte de la API pública del paquete.

export const MIN_YEAR = 1;
export const MAX_YEAR = 9999;

export type CivilDate = {
  readonly year: number;
  readonly month: number;
  readonly day: number;
};

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const THIRTY_DAY_MONTHS: readonly number[] = [4, 6, 9, 11];

/** Días del mes (1–12) de un año. */
export function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  return THIRTY_DAY_MONTHS.includes(month) ? 30 : 31;
}

export function isValidYear(year: number): boolean {
  return Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR;
}

export function isValidMonth(month: number): boolean {
  return Number.isInteger(month) && month >= 1 && month <= 12;
}

export function isValidCivilDate({ year, month, day }: CivilDate): boolean {
  return (
    isValidYear(year) &&
    isValidMonth(month) &&
    Number.isInteger(day) &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  );
}

/**
 * Número de días desde el 1970-01-01 (puede ser negativo).
 * Algoritmo `days_from_civil` de Howard Hinnant: exacto con aritmética entera.
 */
export function toEpochDay({ year, month, day }: CivilDate): number {
  const shiftedYear = month <= 2 ? year - 1 : year;
  const era = Math.floor(shiftedYear / 400);
  const yearOfEra = shiftedYear - era * 400;
  const shiftedMonth = month > 2 ? month - 3 : month + 9;
  const dayOfYear = Math.floor((153 * shiftedMonth + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

/** Inversa de `toEpochDay` (algoritmo `civil_from_days` de Howard Hinnant). */
export function fromEpochDay(epochDay: number): CivilDate {
  const shifted = epochDay + 719468;
  const era = Math.floor(shifted / 146097);
  const dayOfEra = shifted - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) /
      365,
  );
  const dayOfYear =
    dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const shiftedMonth = Math.floor((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.floor((153 * shiftedMonth + 2) / 5) + 1;
  const month = shiftedMonth < 10 ? shiftedMonth + 3 : shiftedMonth - 9;
  const year = yearOfEra + era * 400 + (month <= 2 ? 1 : 0);
  return { year, month, day };
}

/** Día de la semana ISO: 1 = lunes … 7 = domingo. El 1970-01-01 fue jueves. */
export function isoDayOfWeek(epochDay: number): number {
  return ((((epochDay + 3) % 7) + 7) % 7) + 1;
}

export function padNumber(value: number, length: number): string {
  return String(value).padStart(length, '0');
}
