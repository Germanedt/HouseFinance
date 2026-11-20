/** Código SQLSTATE de Postgres de un error, tanto si viene directo como envuelto por Drizzle (`cause`). */
export function postgresErrorCode(error: unknown): string | undefined {
  let current: unknown = error;
  while (typeof current === 'object' && current !== null) {
    if ('code' in current && typeof current.code === 'string') {
      return current.code;
    }
    current = 'cause' in current ? current.cause : undefined;
  }
  return undefined;
}

/** SQLSTATE de una violación de unicidad. */
export const UNIQUE_VIOLATION = '23505';
