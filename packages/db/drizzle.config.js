// Configuración de drizzle-kit (generar y aplicar migraciones).
// - `pnpm --filter @hf/db db:generate`: genera en migrations/ la migración de los cambios del esquema.
//   No necesita conexión. Las migraciones generadas nunca se editan a mano.
// - `pnpm --filter @hf/db db:migrate`: aplica las migraciones pendientes en la base de datos de
//   MIGRATIONS_DATABASE_URL (Session pooler de Supabase; ver docs/supabase.md).
import process from 'node:process';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.MIGRATIONS_DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
});
