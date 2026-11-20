import type { UnitOfWork } from '@hf/application';
import type { Database } from './client.js';
import { isInTransaction, runInTransaction } from './transactionContext.js';

/**
 * Implementa el puerto `UnitOfWork` con transacciones de Drizzle.
 * - Todo lo que hagan los repositorios dentro de `run` (vía `currentExecutor`) va en la misma transacción.
 * - Si `work` termina bien, se confirma; si lanza un error, se deshace y el error se propaga tal cual.
 * - Un `run` dentro de otro se une a la transacción ya abierta: no abre una nueva.
 */
export class DrizzleUnitOfWork implements UnitOfWork {
  constructor(private readonly db: Database) {}

  run<TResult>(work: () => Promise<TResult>): Promise<TResult> {
    if (isInTransaction(this.db)) {
      return work();
    }
    return this.db.transaction((transaction) => runInTransaction(this.db, transaction, work));
  }
}
