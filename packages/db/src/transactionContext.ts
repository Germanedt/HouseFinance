import { AsyncLocalStorage } from 'node:async_hooks';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import type { Database, DatabaseSchema } from './client.js';

/**
 * Lo que usa un repositorio para leer y escribir: la base de datos o la transacción en curso.
 * Las dos tienen la misma API (`PgTransaction` hereda de `PgDatabase`).
 */
export type DbExecutor = PgDatabase<PostgresJsQueryResultHKT, DatabaseSchema>;

type ActiveTransaction = {
  readonly root: Database;
  readonly transaction: DbExecutor;
};

// La transacción en curso viaja con el flujo asíncrono de cada petición, sin pasarla por parámetro:
// así el puerto UnitOfWork no expone ningún tipo de Drizzle a los casos de uso.
const activeTransaction = new AsyncLocalStorage<ActiveTransaction>();

/**
 * Devuelve la transacción en curso de `db` si la hay (dentro de `DrizzleUnitOfWork.run`) o `db` si no.
 * Todos los repositorios de cada fase leen y escriben con lo que devuelve esta función.
 */
export function currentExecutor(db: Database): DbExecutor {
  const active = activeTransaction.getStore();
  return active?.root === db ? active.transaction : db;
}

/** Si hay una transacción abierta de `db` en el flujo actual. */
export function isInTransaction(db: Database): boolean {
  return activeTransaction.getStore()?.root === db;
}

/** Ejecuta `work` con `transaction` como transacción en curso de `root`. */
export function runInTransaction<TResult>(
  root: Database,
  transaction: DbExecutor,
  work: () => Promise<TResult>,
): Promise<TResult> {
  return activeTransaction.run({ root, transaction }, work);
}
