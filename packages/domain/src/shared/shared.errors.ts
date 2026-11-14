import { DomainError } from './DomainError.js';

/** Motivo por el que un importe no es válido; usa los códigos de campo del catálogo. */
export type InvalidMoneyReason = 'NOT_INTEGER' | 'OUT_OF_RANGE';

export type InvalidMoneyDetails = {
  readonly reason: InvalidMoneyReason;
  readonly value: number;
};

/**
 * Importe que no cumple las reglas de `Money`: céntimos enteros, seguros y >= 0.
 * Es una barrera defensiva: el contrato de la API ya rechaza estos valores antes de llegar al
 * dominio, y las reglas de negocio (p. ej. `PRINCIPAL_EXCEEDS_BALANCE`) se validan antes de operar.
 */
export class InvalidMoneyError extends DomainError<'VALIDATION_ERROR', InvalidMoneyDetails> {
  constructor(details: InvalidMoneyDetails) {
    super('VALIDATION_ERROR', details);
  }
}

/** Motivo por el que una fecha o un mes no son válidos; usa los códigos de campo del catálogo. */
export type InvalidCalendarReason = 'INVALID_FORMAT' | 'INVALID_DATE' | 'OUT_OF_RANGE';

export type InvalidCalendarDetails = {
  readonly reason: InvalidCalendarReason;
  readonly value: string | number;
};

/**
 * Fecha de calendario no válida: formato distinto de YYYY-MM-DD, fecha inexistente
 * (`2026-02-30`) o fuera del rango de años 0001–9999. Barrera defensiva, como `InvalidMoneyError`.
 */
export class InvalidCalendarDateError extends DomainError<
  'VALIDATION_ERROR',
  InvalidCalendarDetails
> {
  constructor(details: InvalidCalendarDetails) {
    super('VALIDATION_ERROR', details);
  }
}

/** Mes no válido: formato distinto de YYYY-MM, mes inexistente o día N fuera de 1–28. */
export class InvalidYearMonthError extends DomainError<'VALIDATION_ERROR', InvalidCalendarDetails> {
  constructor(details: InvalidCalendarDetails) {
    super('VALIDATION_ERROR', details);
  }
}
