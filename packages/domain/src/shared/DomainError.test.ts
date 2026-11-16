import { describe, expect, it } from 'vitest';
import {
  DomainError,
  NotFoundError,
  ValidationError,
  type ErrorCode,
  type ErrorDetails,
} from './DomainError.js';

// Errores concretos de ejemplo, como los que creará cada módulo en su fase.
class ObligationNotCancellableError extends DomainError<
  'OBLIGATION_NOT_CANCELLABLE',
  { readonly status: 'closed' | 'cancelled' }
> {
  constructor(status: 'closed' | 'cancelled') {
    super('OBLIGATION_NOT_CANCELLABLE', { status });
  }
}

class MovementVoidedError extends DomainError<'MOVEMENT_VOIDED', undefined> {
  constructor() {
    super('MOVEMENT_VOIDED', undefined);
  }
}

class AnyCodeError extends DomainError<ErrorCode, ErrorDetails> {
  constructor(code: ErrorCode) {
    super(code, { source: 'test' });
  }
}

describe('DomainError', () => {
  it('carries a catalog code and typed details', () => {
    const error = new ObligationNotCancellableError('cancelled');
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('OBLIGATION_NOT_CANCELLABLE');
    expect(error.details).toEqual({ status: 'cancelled' });
  });

  it('can have no details', () => {
    expect(new MovementVoidedError().details).toBeUndefined();
  });

  it('never carries text for the user: the message is the code', () => {
    const error = new ObligationNotCancellableError('closed');
    expect(error.message).toBe('OBLIGATION_NOT_CANCELLABLE');
  });

  it('is named after its concrete class and keeps a stack trace', () => {
    const error = new MovementVoidedError();
    expect(error.name).toBe('MovementVoidedError');
    expect(error.stack).toContain('MovementVoidedError');
  });

  it.each(['NOT_FOUND', 'MOVEMENT_VOIDED', 'BALANCE_ADJUSTMENT_ONLY_FOR_CREDIT_CARD', 'E2E_ERROR'])(
    'accepts the UPPER_SNAKE_CASE code %s',
    (code) => {
      expect(new AnyCodeError(code as ErrorCode).code).toBe(code);
    },
  );

  it('rejects lowercase codes at compile time and at runtime', () => {
    expect(
      // @ts-expect-error: ErrorCode exige mayúsculas; si esta línea compilara, el typecheck fallaría.
      () => new AnyCodeError('not_found'),
    ).toThrow(TypeError);
  });

  // Los tipos ya impiden minúsculas en los literales; esto cubre códigos construidos en ejecución.
  it.each(['', 'NOT FOUND', 'NOT-FOUND', '_NOT_FOUND', 'NOT_FOUND_', 'NOT__FOUND', '1_ERROR', 'Ñ'])(
    'rejects the code %j',
    (code) => {
      expect(() => new AnyCodeError(code as ErrorCode)).toThrow(TypeError);
    },
  );
});

describe('NotFoundError', () => {
  it.each(['obligation', 'bill', 'movement', 'income', 'actor', 'notice'] as const)(
    'reports a missing %s with code NOT_FOUND',
    (resource) => {
      const error = new NotFoundError(resource);
      expect(error).toBeInstanceOf(DomainError);
      expect(error.name).toBe('NotFoundError');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.details).toEqual({ resource });
    },
  );
});

describe('ValidationError', () => {
  it('lists the invalid fields with the shape of the error response', () => {
    const error = new ValidationError([
      { path: 'principalCents', code: 'REQUIRED' },
      { path: 'dueDayRule.fixedDay', code: 'OUT_OF_RANGE' },
    ]);
    expect(error).toBeInstanceOf(DomainError);
    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.fields).toEqual([
      { path: 'principalCents', code: 'REQUIRED' },
      { path: 'dueDayRule.fixedDay', code: 'OUT_OF_RANGE' },
    ]);
    expect(error.details).toBeUndefined();
  });

  it('keeps its fields immutable and independent from the input', () => {
    const input = [{ path: 'name', code: 'TOO_LONG' as const }] as const;
    const error = new ValidationError(input);
    expect(Object.isFrozen(error.fields)).toBe(true);
    expect(Object.isFrozen(error.fields[0])).toBe(true);
    expect(error.fields).not.toBe(input);
    expect(error.fields[0]).not.toBe(input[0]);
  });
});
