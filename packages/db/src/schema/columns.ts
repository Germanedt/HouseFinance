// Columnas comunes reutilizables (`claude/contratos-api.md`, paso 4.1). Cada fase las usa en sus tablas.
// Los nombres de columna van en snake_case, explícitos; los campos de TypeScript, en camelCase.
//
// Excepción a la regla de retornos explícitos: el tipo de cada columna lo construye Drizzle paso a paso
// (`.notNull()`, `.defaultNow()`…) y de él salen los tipos de las filas. Escribirlo a mano lo perdería,
// así que se deja inferido en este archivo.
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { sql, type SQL } from 'drizzle-orm';
import { bigint, check, date, timestamp, uuid, type AnyPgColumn } from 'drizzle-orm/pg-core';

/** Clave primaria UUID generada por Postgres. */
export function idColumn() {
  return uuid('id').primaryKey().defaultRandom();
}

/**
 * Dueño del registro: el id del usuario de Supabase Auth (`auth.users.id`).
 * No lleva clave foránea a `auth.users`: el esquema `auth` es de Supabase, y RLS
 * (`user_id = auth.uid()`) junto al filtro de los repositorios hace de barrera.
 */
export function userIdColumn() {
  return uuid('user_id').notNull();
}

/** `created_at` y `updated_at` (timestamptz en UTC). `updated_at` se renueva en cada actualización. */
export function timestampColumns() {
  return {
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  };
}

/** Borrado lógico: nunca hay DELETE físico. */
export function deletedAtColumn() {
  return timestamp('deleted_at', { withTimezone: true, mode: 'date' });
}

/** Anulación de pagos y movimientos: el registro se conserva en el historial. */
export function voidedAtColumn() {
  return timestamp('voided_at', { withTimezone: true, mode: 'date' });
}

/**
 * Importe en céntimos: `bigint` leído como `number` (seguro hasta Number.MAX_SAFE_INTEGER, igual que `Money`).
 * Cada tabla añade su `CHECK (>= 0)` con `nonNegativeMoneyCheck`.
 */
export function moneyColumn<TName extends string>(name: TName) {
  return bigint(name, { mode: 'number' });
}

/** Fecha de calendario sin hora ni zona: `date` leído como texto `YYYY-MM-DD` (se mapea a `CalendarDate`). */
export function calendarDateColumn<TName extends string>(name: TName) {
  return date(name, { mode: 'string' });
}

/** Restricción `CHECK (columna >= 0)` para un importe; el nombre sigue `<tabla>_<columna>_non_negative`. */
export function nonNegativeMoneyCheck(
  table: string,
  column: AnyPgColumn,
): ReturnType<typeof check> {
  return check(`${table}_${column.name}_non_negative`, nonNegative(column));
}

function nonNegative(column: AnyPgColumn): SQL {
  return sql`${column} >= 0`;
}
