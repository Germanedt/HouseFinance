import { describe, expect, it } from 'vitest';
import { DomainError } from './DomainError.js';
import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  UnauthenticatedError,
} from './session.errors.js';

describe('session errors', () => {
  it.each([
    [new InvalidCredentialsError(), 'InvalidCredentialsError', 'INVALID_CREDENTIALS'],
    [new InvalidRefreshTokenError(), 'InvalidRefreshTokenError', 'INVALID_REFRESH_TOKEN'],
    [new UnauthenticatedError(), 'UnauthenticatedError', 'UNAUTHENTICATED'],
  ])('%o has the catalog code and no details', (error, name, code) => {
    expect(error).toBeInstanceOf(DomainError);
    expect(error.name).toBe(name);
    expect(error.code).toBe(code);
    expect(error.message).toBe(code);
    expect(error.details).toBeUndefined();
  });
});
