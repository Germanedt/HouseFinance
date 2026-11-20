// Preparación global de las pruebas de integración de @hf/db (`pnpm test:integration`).
// A partir de TEST_DATABASE_URL (un Postgres con permiso para crear bases de datos):
//   1. crea una base de datos temporal y vacía, solo para esta ejecución;
//   2. le aplica todas las migraciones de migrations/, como se aplicarían en Supabase;
//   3. la pasa a las pruebas (`inject('databaseUrl')`) y la destruye al terminar.
// En la CI, TEST_DATABASE_URL apunta al contenedor de servicio de Postgres del job.
import { randomUUID } from 'node:crypto';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Vitest se amplía con declaration merging, que exige una interface.
  export interface ProvidedContext {
    /** Cadena de conexión de la base de datos temporal, ya migrada. */
    databaseUrl: string;
  }
}

const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../migrations', import.meta.url));

export async function setup(project: TestProject): Promise<() => Promise<void>> {
  const adminUrl = process.env['TEST_DATABASE_URL'];
  if (adminUrl === undefined || adminUrl === '') {
    throw new Error(
      'Falta TEST_DATABASE_URL: las pruebas de integración necesitan un Postgres (p. ej. postgres://postgres:postgres@localhost:5432/postgres).',
    );
  }

  const databaseName = `hf_test_${randomUUID().replaceAll('-', '')}`;
  const admin = postgres(adminUrl, { max: 1, onnotice: () => undefined });
  await admin.unsafe(`CREATE DATABASE "${databaseName}"`);

  const databaseUrl = withDatabase(adminUrl, databaseName);
  const migrationConnection = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
  try {
    await migrate(drizzle(migrationConnection), { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await migrationConnection.end();
  }

  project.provide('databaseUrl', databaseUrl);

  return async () => {
    await admin.unsafe(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
    await admin.end();
  };
}

function withDatabase(connectionString: string, databaseName: string): string {
  const url = new URL(connectionString);
  url.pathname = `/${databaseName}`;
  return url.toString();
}
