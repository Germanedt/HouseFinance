import { describe, expect, it } from 'vitest';
import { DomainError } from './DomainError.js';
import { Money } from './Money.value-object.js';
import { InvalidMoneyError, type InvalidMoneyReason } from './shared.errors.js';

function cents(value: number): Money {
  return Money.fromCents(value);
}

function captureError(action: () => unknown): unknown {
  try {
    action();
  } catch (error: unknown) {
    return error;
  }
  throw new Error('Expected the action to throw');
}

function expectInvalidMoney(
  action: () => unknown,
  reason: InvalidMoneyReason,
  value: number,
): void {
  const error = captureError(action);
  expect(error).toBeInstanceOf(InvalidMoneyError);
  expect(error).toBeInstanceOf(DomainError);
  expect(error).toMatchObject({
    name: 'InvalidMoneyError',
    code: 'VALIDATION_ERROR',
    message: 'VALIDATION_ERROR',
    details: { reason, value },
  });
}

describe('Money', () => {
  describe('fromCents', () => {
    it('creates an amount from integer cents', () => {
      expect(cents(243117).cents).toBe(243117);
    });

    it('accepts 0 and normalizes -0 to 0', () => {
      expect(cents(0).cents).toBe(0);
      expect(Object.is(cents(-0).cents, 0)).toBe(true);
    });

    it('accepts the largest safe integer', () => {
      expect(cents(Number.MAX_SAFE_INTEGER).cents).toBe(Number.MAX_SAFE_INTEGER);
    });

    it.each([0.5, 10.01, Number.NaN, Number.POSITIVE_INFINITY])(
      'rejects %s because it is not an integer',
      (value) => {
        expectInvalidMoney(() => cents(value), 'NOT_INTEGER', value);
      },
    );

    it.each([-1, -100, Number.MAX_SAFE_INTEGER + 1])(
      'rejects %s because it is out of range',
      (value) => {
        expectInvalidMoney(() => cents(value), 'OUT_OF_RANGE', value);
      },
    );
  });

  describe('immutability', () => {
    it('cannot be modified', () => {
      const amount = cents(100);
      expect(Object.isFrozen(amount)).toBe(true);
      expect(() => {
        Object.assign(amount, { cents: 1 });
      }).toThrow(TypeError);
      expect(amount.cents).toBe(100);
    });

    it('returns new instances from operations', () => {
      const amount = cents(100);
      const result = amount.add(cents(50));
      expect(result).not.toBe(amount);
      expect(amount.cents).toBe(100);
    });
  });

  describe('zero', () => {
    it('is an amount of 0 cents', () => {
      expect(Money.zero().cents).toBe(0);
      expect(Money.zero().isZero()).toBe(true);
    });
  });

  describe('add', () => {
    it('adds two amounts', () => {
      expect(cents(225000).add(cents(18117)).cents).toBe(243117);
    });

    it('keeps the amount when adding 0', () => {
      expect(cents(500).add(Money.zero()).cents).toBe(500);
    });

    it('rejects a sum beyond the safe integer range', () => {
      expectInvalidMoney(
        () => cents(Number.MAX_SAFE_INTEGER).add(cents(1)),
        'OUT_OF_RANGE',
        Number.MAX_SAFE_INTEGER + 1,
      );
    });
  });

  describe('subtract', () => {
    it('subtracts a smaller amount', () => {
      expect(cents(931864).subtract(cents(31864)).cents).toBe(900000);
    });

    it('reaches exactly 0 when subtracting the same amount', () => {
      expect(cents(1500).subtract(cents(1500)).isZero()).toBe(true);
    });

    it('never goes below 0', () => {
      expectInvalidMoney(() => cents(100).subtract(cents(101)), 'OUT_OF_RANGE', -1);
    });
  });

  describe('comparison', () => {
    it('compares two amounts', () => {
      expect(cents(100).compareTo(cents(200))).toBe(-1);
      expect(cents(200).compareTo(cents(100))).toBe(1);
      expect(cents(150).compareTo(cents(150))).toBe(0);
    });

    it('tells whether an amount is greater or less than another', () => {
      expect(cents(200).isGreaterThan(cents(100))).toBe(true);
      expect(cents(100).isGreaterThan(cents(100))).toBe(false);
      expect(cents(100).isLessThan(cents(200))).toBe(true);
      expect(cents(100).isLessThan(cents(100))).toBe(false);
    });

    it('tells whether an amount is 0', () => {
      expect(cents(0).isZero()).toBe(true);
      expect(cents(1).isZero()).toBe(false);
    });
  });

  describe('equals', () => {
    it('compares by value', () => {
      expect(cents(250).equals(cents(250))).toBe(true);
      expect(cents(250).equals(cents(251))).toBe(false);
    });
  });

  describe('min', () => {
    it('returns the smaller of two amounts', () => {
      expect(Money.min(cents(931864), cents(45000)).cents).toBe(45000);
      expect(Money.min(cents(45000), cents(931864)).cents).toBe(45000);
    });

    it('caps an installment at a lower outstanding balance', () => {
      const installment = cents(45000);
      const outstandingBalance = cents(12034);
      expect(Money.min(installment, outstandingBalance).equals(outstandingBalance)).toBe(true);
    });

    it('returns an equal amount when both are equal', () => {
      expect(Money.min(cents(300), cents(300)).cents).toBe(300);
    });

    it('handles 0', () => {
      expect(Money.min(Money.zero(), cents(300)).cents).toBe(0);
    });
  });

  describe('average', () => {
    it('returns the amount itself for a single amount', () => {
      expect(Money.average([cents(6789)]).cents).toBe(6789);
    });

    it('averages amounts with an exact result', () => {
      expect(Money.average([cents(5000), cents(7000)]).cents).toBe(6000);
    });

    it('rounds an exact half up', () => {
      expect(Money.average([cents(100), cents(101)]).cents).toBe(101);
      expect(Money.average([cents(0), cents(1)]).cents).toBe(1);
    });

    it('rounds below half down and above half up', () => {
      // 10 / 3 = 3.33… → 3
      expect(Money.average([cents(3), cents(3), cents(4)]).cents).toBe(3);
      // 11 / 3 = 3.66… → 4
      expect(Money.average([cents(3), cents(4), cents(4)]).cents).toBe(4);
    });

    it('averages zeros to 0', () => {
      expect(Money.average([Money.zero(), Money.zero()]).isZero()).toBe(true);
    });

    it('averages real service bills without floating point errors', () => {
      // (64,35 € + 71,20 €) / 2 = 67,775 € → 67,78 €
      expect(Money.average([cents(6435), cents(7120)]).cents).toBe(6778);
    });
  });
});
