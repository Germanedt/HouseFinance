// Registro de ejecuciones del cron (`claude/contratos-api.md`, paso 4.9). Es del sistema:
// no tiene `user_id` y no depende de ningún módulo. El índice único (job, run_date) es lo que
// hace idempotente el job diario (`alreadyRun: true`).
import { jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { calendarDateColumn, idColumn } from './columns.js';

export const jobRunsTable = pgTable(
  'job_runs',
  {
    id: idColumn(),
    /** Nombre del job, p. ej. `daily_close`. */
    job: text('job').notNull(),
    runDate: calendarDateColumn('run_date').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'date' }),
    /** Contadores que devuelve el endpoint del job. */
    result: jsonb('result').$type<Readonly<Record<string, unknown>>>(),
  },
  (table) => [uniqueIndex('job_runs_job_run_date_unique').on(table.job, table.runDate)],
).enableRLS();
