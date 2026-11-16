import type { CalendarDate } from '@hf/domain';

/**
 * Da la fecha de "hoy". Los casos de uso nunca usan `new Date()`: así "hoy" se puede fijar
 * en las pruebas. La implementación real usa el reloj del servidor (UTC en Vercel).
 */
export type Clock = {
  today(): CalendarDate;
};
