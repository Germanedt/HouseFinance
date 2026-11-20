import { describe, expect, it } from 'vitest';
import * as publicApi from './index.js';

describe('@hf/db public API', () => {
  it('exposes the client, the unit of work, the executor and the schema', () => {
    expect(publicApi.createDatabaseClient).toBeTypeOf('function');
    expect(publicApi.DrizzleUnitOfWork).toBeTypeOf('function');
    expect(publicApi.currentExecutor).toBeTypeOf('function');
    expect(publicApi.jobRunsTable).toBeDefined();
    expect(publicApi.billStatusEnum.enumValues).toEqual(['pending', 'paid', 'collected']);
  });

  it('creates a client without connecting until the first query', async () => {
    const client = publicApi.createDatabaseClient({
      connectionString: 'postgres://user:password@localhost:1/never',
    });
    expect(client.db).toBeDefined();
    await expect(client.close()).resolves.toBeUndefined();
  });
});
