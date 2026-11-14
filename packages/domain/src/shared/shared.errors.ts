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
