import type { UnitOfWork } from '../shared/ports/index.js';

/**
 * Unidad de trabajo para pruebas: ejecuta la función tal cual y cuenta las ejecuciones, para
 * comprobar que un caso de uso escribe dentro de una transacción.
 * No deshace cambios si la función falla: eso lo garantiza `DrizzleUnitOfWork` (F0-10) y se
 * prueba en las pruebas de integración de `@hf/db`.
 */
export class InMemoryUnitOfWork implements UnitOfWork {
  private completed = 0;
  private failed = 0;
  private active = 0;

  async run<TResult>(work: () => Promise<TResult>): Promise<TResult> {
    this.active += 1;
    try {
      const result = await work();
      this.completed += 1;
      return result;
    } catch (error: unknown) {
      this.failed += 1;
      throw error;
    } finally {
      this.active -= 1;
    }
  }

  /** Transacciones terminadas con éxito. */
  get completedRuns(): number {
    return this.completed;
  }

  /** Transacciones en las que la función lanzó un error. */
  get failedRuns(): number {
    return this.failed;
  }

  /** Si en este momento hay una transacción en curso (útil dentro de un repositorio en memoria). */
  get isInTransaction(): boolean {
    return this.active > 0;
  }
}
