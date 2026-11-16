import { CalendarDate } from '@hf/domain';
import { describe, expect, it } from 'vitest';
import type { HolidayCalendar } from '../shared/ports/index.js';
import { NoHolidaysCalendar } from './NoHolidaysCalendar.js';

describe('NoHolidaysCalendar', () => {
  it.each(['2026-01-01', '2026-12-25', '2026-11-16', '2026-11-22'])(
    'never treats %s as a holiday',
    (value) => {
      const calendar: HolidayCalendar = new NoHolidaysCalendar();
      expect(calendar.isHoliday(CalendarDate.fromString(value))).toBe(false);
    },
  );
});
