import { CalendarDate } from '@hf/domain';
import { describe, expect, it } from 'vitest';
import type { Clock } from '../shared/ports/index.js';
import { FixedClock } from './FixedClock.js';

describe('FixedClock', () => {
  it('returns the date it was given as today', () => {
    const clock: Clock = new FixedClock(CalendarDate.fromString('2026-11-16'));
    expect(clock.today().toString()).toBe('2026-11-16');
    expect(clock.today().toString()).toBe('2026-11-16');
  });

  it('changes today on demand', () => {
    const clock = new FixedClock(CalendarDate.fromString('2026-11-16'));
    clock.setToday(CalendarDate.fromString('2026-12-01'));
    expect(clock.today().toString()).toBe('2026-12-01');
  });

  it('moves today forward and back by days, across months and years', () => {
    const clock = new FixedClock(CalendarDate.fromString('2026-12-31'));
    clock.advanceDays(1);
    expect(clock.today().toString()).toBe('2027-01-01');
    clock.advanceDays(-32);
    expect(clock.today().toString()).toBe('2026-11-30');
  });
});
