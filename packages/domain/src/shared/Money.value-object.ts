import { InvalidMoneyError } from './shared.errors.js';

/** Resultado de comparar dos importes: -1 menor, 0 igual, 1 mayor. */
export type MoneyComparison = -1 | 0 | 1;

/**
 * Importe en céntimos de euro: entero, >= 0 e inmutable.
 * Nunca usa decimales; solo se formatea al mostrarlo, fuera del dominio.
 */
export class Money {
  readonly cents: number;

  private constructor(cents: number) {
    this.cents = cents;
    Object.freeze(this);
  }

  /** Crea un importe desde céntimos enteros >= 0. Lanza `InvalidMoneyError` si no lo son. */
  static fromCents(cents: number): Money {
    if (!Number.isInteger(cents)) {
      throw new InvalidMoneyError({ reason: 'NOT_INTEGER', value: cents });
    }
    if (cents < 0 || !Number.isSafeInteger(cents)) {
      throw new InvalidMoneyError({ reason: 'OUT_OF_RANGE', value: cents });
    }
    // Normaliza -0 a 0.
    return new Money(cents === 0 ? 0 : cents);
  }

  static zero(): Money {
    return Money.fromCents(0);
  }

  /** El menor de dos importes (p. ej. el tope por saldo). */
  static min(first: Money, second: Money): Money {
    return first.isGreaterThan(second) ? second : first;
  }

  /**
   * Promedio de uno o más importes, redondeado al céntimo con la mitad hacia arriba
   * (p. ej. el estimado de un servicio). Se calcula con enteros, sin errores de coma flotante.
   */
  static average(amounts: readonly [Money, ...Money[]]): Money {
    const total = amounts.reduce((sum, amount) => sum.add(amount), Money.zero()).cents;
    const count = amounts.length;
    const quotient = Math.floor(total / count);
    const remainder = total - quotient * count;
    return Money.fromCents(remainder * 2 >= count ? quotient + 1 : quotient);
  }

  add(other: Money): Money {
    return Money.fromCents(this.cents + other.cents);
  }

  /** Resta sin quedar por debajo de 0: si `other` es mayor, lanza `InvalidMoneyError`. */
  subtract(other: Money): Money {
    return Money.fromCents(this.cents - other.cents);
  }

  compareTo(other: Money): MoneyComparison {
    if (this.cents === other.cents) {
      return 0;
    }
    return this.cents > other.cents ? 1 : -1;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  isGreaterThan(other: Money): boolean {
    return this.cents > other.cents;
  }

  isLessThan(other: Money): boolean {
    return this.cents < other.cents;
  }

  isZero(): boolean {
    return this.cents === 0;
  }
}
