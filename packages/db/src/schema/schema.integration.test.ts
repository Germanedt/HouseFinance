import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { createDatabaseClient, type DatabaseClient } from '../client.js';
import { postgresErrorCode, UNIQUE_VIOLATION } from '../testing/postgresErrors.js';
import { jobRunsTable } from './index.js';

// La base de datos temporal se crea vacía y recibe todas las migraciones de migrations/:
// estas pruebas comprueban que el resultado es el esquema esperado.
let client: DatabaseClient;

beforeAll(() => {
  client = createDatabaseClient({ connectionString: inject('databaseUrl') });
});

afterAll(async () => {
  await client.close();
});

describe('migrations applied to an empty database', () => {
  it('create every enum of the glossary with its values in order', async () => {
    const rows = await client.db.execute<{ name: string; values: string[] }>(sql`
      select t.typname as name, array_agg(e.enumlabel order by e.enumsortorder) as values
      from pg_type t
      join pg_enum e on e.enumtypid = t.oid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
      group by t.typname
      order by t.typname
    `);

    expect(Object.fromEntries(rows.map((row) => [row.name, row.values]))).toEqual({
      actor_type: ['person', 'bank', 'company', 'other'],
      bill_direction: ['payable', 'receivable'],
      bill_status: ['pending', 'paid', 'collected'],
      due_day_rule: ['first_business_day', 'last_business_day', 'fixed_day'],
      frequency: ['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual', 'one_time'],
      income_type: ['salary', 'gift', 'donation', 'other'],
      movement_type: ['extra_payment', 'balance_adjustment'],
      notice_type: ['register_fixed_income'],
      obligation_status: ['pending_confirmation', 'active', 'closed', 'cancelled'],
      obligation_type: ['loan', 'service', 'receivable', 'credit_card'],
    });
  });

  it('create job_runs with row level security enabled', async () => {
    const rows = await client.db.execute<{ rls: boolean }>(sql`
      select relrowsecurity as rls from pg_class where relname = 'job_runs' and relkind = 'r'
    `);
    expect(rows.map((row) => row.rls)).toEqual([true]);
  });
});

describe('job_runs', () => {
  it('stores a run with its calendar date as YYYY-MM-DD and defaults', async () => {
    const [row] = await client.db
      .insert(jobRunsTable)
      .values({ job: 'daily_close', runDate: '2026-11-01' })
      .returning();

    expect(row).toMatchObject({ job: 'daily_close', runDate: '2026-11-01', finishedAt: null });
    expect(row?.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(row?.startedAt).toBeInstanceOf(Date);
  });

  it('allows one run per job and day, which makes the daily job idempotent', async () => {
    await client.db.insert(jobRunsTable).values({ job: 'daily_close', runDate: '2026-11-02' });

    const duplicate = client.db
      .insert(jobRunsTable)
      .values({ job: 'daily_close', runDate: '2026-11-02' });
    const error: unknown = await duplicate.then(
      () => undefined,
      (failure: unknown) => failure,
    );
    expect(postgresErrorCode(error)).toBe(UNIQUE_VIOLATION);

    // Otro día u otro job sí se pueden registrar.
    await client.db.insert(jobRunsTable).values([
      { job: 'daily_close', runDate: '2026-11-03' },
      { job: 'other_job', runDate: '2026-11-02' },
    ]);
  });
});
