import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

export type DatabaseSchema = typeof schema;

/** Base de datos de Drizzle sobre postgres.js, con el esquema completo de HouseFinance. */
export type Database = PostgresJsDatabase<DatabaseSchema>;

export type DatabaseClientOptions = {
  /** Cadena de conexión. En producción, `DATABASE_URL` (Transaction pooler de Supabase). */
  readonly connectionString: string;
  /** Conexiones máximas del pool. En funciones serverless conviene pocas (1 por defecto). */
  readonly maxConnections?: number;
};

export type DatabaseClient = {
  readonly db: Database;
  /** Cierra las conexiones (pruebas y scripts; en Vercel la función se recicla sola). */
  close(): Promise<void>;
};

/**
 * Crea el cliente de Drizzle contra el Postgres de Supabase.
 * `prepare: false` es obligatorio con el Transaction pooler (Supavisor en modo transacción),
 * que no admite prepared statements.
 * Solo se llama desde la composición de `apps/api`: el resto del código recibe `Database`.
 */
export function createDatabaseClient(options: DatabaseClientOptions): DatabaseClient {
  const sql = postgres(options.connectionString, {
    prepare: false,
    max: options.maxConnections ?? 1,
  });
  const db = drizzle(sql, { schema });
  return {
    db,
    close: () => sql.end(),
  };
}
