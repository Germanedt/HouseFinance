import type { CalendarDate } from '@hf/domain';
import type { Clock } from '../shared/ports/index.js';

/** Reloj fijo para pruebas: "hoy" es la fecha que se le indica y solo cambia a mano. */
export class FixedClock implements Clock {
  private current: CalendarDate;

  constructor(today: CalendarDate) {
    this.current = today;
  }

  today(): CalendarDate {
    return this.current;
  }

  /** Cambia "hoy" (p. ej. para probar el job del día 1). */
  setToday(today: CalendarDate): void {
    this.current = today;
  }

  /** Avanza (o retrocede, con un número negativo) "hoy" en días. */
  advanceDays(days: number): void {
    this.current = this.current.addDays(days);
  }
}
