import type { HolidayCalendar } from '../shared/ports/index.js';

/** Calendario sin festivos: el del MVP, donde los días hábiles son de lunes a viernes. */
export class NoHolidaysCalendar implements HolidayCalendar {
  isHoliday(): boolean {
    return false;
  }
}
