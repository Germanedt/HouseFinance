import { describe, expect, it } from 'vitest';
import * as publicApi from './index.js';

describe('@hf/domain public API', () => {
  it('exposes the shared value objects and errors', () => {
    expect(publicApi.Money.fromCents(1).cents).toBe(1);
    expect(publicApi.DomainError).toBeTypeOf('function');
    expect(publicApi.InvalidMoneyError).toBeTypeOf('function');
    expect(publicApi.CalendarDate.fromString('2026-11-14').toString()).toBe('2026-11-14');
    expect(publicApi.YearMonth.fromString('2026-11').toString()).toBe('2026-11');
    expect(publicApi.InvalidCalendarDateError).toBeTypeOf('function');
    expect(publicApi.InvalidYearMonthError).toBeTypeOf('function');
  });
});
