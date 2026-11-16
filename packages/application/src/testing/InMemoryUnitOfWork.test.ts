import { describe, expect, it } from 'vitest';
import type { UnitOfWork } from '../shared/ports/index.js';
import { InMemoryUnitOfWork } from './InMemoryUnitOfWork.js';

describe('InMemoryUnitOfWork', () => {
  it('runs the work and returns its result', async () => {
    const unitOfWork: UnitOfWork = new InMemoryUnitOfWork();
    await expect(unitOfWork.run(() => Promise.resolve(42))).resolves.toBe(42);
  });

  it('counts completed runs', async () => {
    const unitOfWork = new InMemoryUnitOfWork();
    await unitOfWork.run(() => Promise.resolve('first'));
    await unitOfWork.run(() => Promise.resolve('second'));
    expect(unitOfWork.completedRuns).toBe(2);
    expect(unitOfWork.failedRuns).toBe(0);
  });

  it('propagates the error of the work unchanged and counts the failure', async () => {
    const unitOfWork = new InMemoryUnitOfWork();
    const failure = new Error('write failed');
    await expect(unitOfWork.run(() => Promise.reject(failure))).rejects.toBe(failure);
    expect(unitOfWork.failedRuns).toBe(1);
    expect(unitOfWork.completedRuns).toBe(0);
  });

  it('tells whether the work is running inside the transaction', async () => {
    const unitOfWork = new InMemoryUnitOfWork();
    expect(unitOfWork.isInTransaction).toBe(false);
    const insideTransaction = await unitOfWork.run(() =>
      Promise.resolve(unitOfWork.isInTransaction),
    );
    expect(insideTransaction).toBe(true);
    expect(unitOfWork.isInTransaction).toBe(false);
  });

  it('leaves the transaction after a failure', async () => {
    const unitOfWork = new InMemoryUnitOfWork();
    await expect(unitOfWork.run(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    expect(unitOfWork.isInTransaction).toBe(false);
  });
});
