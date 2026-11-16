import type { CalendarDate } from '@hf/domain';

/**
 * Dice si un día es festivo, para calcular los días hábiles (`BusinessDayCalendar`).
 * En el MVP no hay festivos; añadirlos es otra implementación de este puerto.
 */
export type HolidayCalendar = {
  isHoliday(date: CalendarDate): boolean;
};
