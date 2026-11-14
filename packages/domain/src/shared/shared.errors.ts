// Errores de los objetos de valor compartidos (Money, CalendarDate, YearMonth).
// Son barreras defensivas: el contrato de la API ya rechaza estos valores antes de llegar al
// dominio, y las reglas de negocio (p. ej. `PRINCIPAL_EXCEEDS_BALANCE`) se validan antes de operar.
// Todos son `ValidationError` (VALIDATION_ERROR + fields), con `path` = el argumento que falló.
import { ValidationError, type FieldError } from './DomainError.js';

export type InvalidMoneyFieldCode = 'NOT_INTEGER' | 'OUT_OF_RANGE';

/** Importe que no es un entero de céntimos seguro y >= 0. */
export class InvalidMoneyError extends ValidationError<InvalidMoneyFieldCode> {
  constructor(field: FieldError<InvalidMoneyFieldCode>) {
    super([field]);
  }
}

export type InvalidCalendarFieldCode = 'INVALID_FORMAT' | 'INVALID_DATE' | 'OUT_OF_RANGE';

/**
 * Fecha de calendario no válida: formato distinto de YYYY-MM-DD, fecha inexistente
 * (`2026-02-30`) o fuera de los años 0001–9999.
 */
export class InvalidCalendarDateError extends ValidationError<InvalidCalendarFieldCode> {
  constructor(field: FieldError<InvalidCalendarFieldCode>) {
    super([field]);
  }
}

/** Mes no válido: formato distinto de YYYY-MM, mes inexistente o día N fuera de 1–28. */
export class InvalidYearMonthError extends ValidationError<InvalidCalendarFieldCode> {
  constructor(field: FieldError<InvalidCalendarFieldCode>) {
    super([field]);
  }
}
