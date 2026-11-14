import { describe, expect, it } from 'vitest';
import * as publicApi from './index.js';

describe('@hf/domain public API', () => {
  it('exposes the shared value objects and errors', () => {
    expect(publicApi.Money.fromCents(1).cents).toBe(1);
    expect(publicApi.DomainError).toBeTypeOf('function');
    expect(publicApi.InvalidMoneyError).toBeTypeOf('function');
  });
});
