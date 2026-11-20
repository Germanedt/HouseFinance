import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, inject, it } from 'vitest';
import { createDatabaseClient, type DatabaseClient } from './client.js';
import { DrizzleUnitOfWork } from './DrizzleUnitOfWork.js';
import { jobRunsTable } from './schema/index.js';
import { currentExecutor } from './transactionContext.js';

// `job_runs` hace de tabla de ejemplo: es la única que existe en la fase 0.
let client: DatabaseClient;
let otherClient: DatabaseClient;
let unitOfWork: DrizzleUnitOfWork;

async function insertJobRun(job: string, runDate = '2026-11-20'): Promise<void> {
  await currentExecutor(client.db).insert(jobRunsTable).values({ job, runDate });
}

async function storedJobs(): Promise<string[]> {
  const rows = await client.db.select({ job: jobRunsTable.job }).from(jobRunsTable);
  return rows.map((row) => row.job).sort();
}

beforeAll(() => {
  client = createDatabaseClient({ connectionString: inject('databaseUrl'), maxConnections: 4 });
  otherClient = createDatabaseClient({ connectionString: inject('databaseUrl') });
  unitOfWork = new DrizzleUnitOfWork(client.db);
});

afterAll(async () => {
  await client.close();
  await otherClient.close();
});

beforeEach(async () => {
  await client.db.delete(jobRunsTable);
});

describe('DrizzleUnitOfWork', () => {
  it('commits every write when the work succeeds and returns its result', async () => {
    const result = await unitOfWork.run(async () => {
      await insertJobRun('first');
      await insertJobRun('second');
      return 'done';
    });

    expect(result).toBe('done');
    expect(await storedJobs()).toEqual(['first', 'second']);
  });

  it('rolls back every write when the work fails and propagates the same error', async () => {
    const failure = new Error('second write failed');

    await expect(
      unitOfWork.run(async () => {
        await insertJobRun('first');
        throw failure;
      }),
    ).rejects.toBe(failure);

    expect(await storedJobs()).toEqual([]);
  });

  it('rolls back when the database rejects a write in the middle of the work', async () => {
    await expect(
      unitOfWork.run(async () => {
        await insertJobRun('daily_close');
        await insertJobRun('other');
        // Viola el índice único (job, run_date).
        await insertJobRun('daily_close');
      }),
    ).rejects.toThrow();

    expect(await storedJobs()).toEqual([]);
  });

  it('keeps uncommitted writes invisible outside the transaction until it commits', async () => {
    await unitOfWork.run(async () => {
      await insertJobRun('pending');
      // Otra conexión, fuera de la transacción, todavía no ve la fila.
      const seenOutside = await otherClient.db.select().from(jobRunsTable);
      expect(seenOutside).toEqual([]);
    });

    expect(await storedJobs()).toEqual(['pending']);
  });

  it('uses the transaction inside run and the plain database outside it', async () => {
    expect(currentExecutor(client.db)).toBe(client.db);

    await unitOfWork.run(() => {
      expect(currentExecutor(client.db)).not.toBe(client.db);
      return Promise.resolve();
    });

    expect(currentExecutor(client.db)).toBe(client.db);
  });

  it('does not lend its transaction to another database client', async () => {
    await unitOfWork.run(() => {
      expect(currentExecutor(otherClient.db)).toBe(otherClient.db);
      return Promise.resolve();
    });
  });

  it('joins the open transaction when run is nested, so a failure rolls back both', async () => {
    await expect(
      unitOfWork.run(async () => {
        await insertJobRun('outer');
        await unitOfWork.run(async () => {
          await insertJobRun('inner');
        });
        throw new Error('outer failed after inner');
      }),
    ).rejects.toThrow('outer failed after inner');

    expect(await storedJobs()).toEqual([]);
  });

  it('keeps concurrent runs in separate transactions', async () => {
    const results = await Promise.allSettled([
      unitOfWork.run(async () => {
        await insertJobRun('committed');
      }),
      unitOfWork.run(async () => {
        await insertJobRun('rolled_back');
        throw new Error('only this one fails');
      }),
    ]);

    expect(results.map((result) => result.status)).toEqual(['fulfilled', 'rejected']);
    expect(await storedJobs()).toEqual(['committed']);
  });

  it('writes through the transaction executor', async () => {
    await unitOfWork.run(async () => {
      await insertJobRun('daily_close');
      await currentExecutor(client.db)
        .update(jobRunsTable)
        .set({ result: { confirmedObligations: 2 } })
        .where(eq(jobRunsTable.job, 'daily_close'));
    });

    const [row] = await client.db.select().from(jobRunsTable);
    expect(row?.result).toEqual({ confirmedObligations: 2 });
  });
});
