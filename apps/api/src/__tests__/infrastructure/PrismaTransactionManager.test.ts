import { describe, it, expect, vi } from 'vitest';
import { createTestDb } from '#src/__tests__/helpers/createTestDb.js';
import { PrismaTransactionManager } from '#src/infrastructure/db/PrismaTransactionManager.js';
import { PrismaUserRepository } from '#src/infrastructure/db/repositories/PrismaUserRepository.js';
import { nanoid } from 'nanoid';

describe('PrismaTransactionManager', () => {
  it('commits all writes when the callback succeeds', async () => {
    const { prisma, cleanup } = await createTestDb();
    const tm = new PrismaTransactionManager({ prisma });
    const userRepo = new PrismaUserRepository({ prisma });

    const id = nanoid();
    await tm.run(async () => {
      await userRepo.create({ id, email: `${id}@example.com`, passwordHash: 'hash' });
    });

    const found = await userRepo.findById(id);
    expect(found).not.toBeNull();
    expect(found!.email).toBe(`${id}@example.com`);
    await cleanup();
  });

  it('rolls back all writes when the callback throws', async () => {
    const { prisma, cleanup } = await createTestDb();
    const tm = new PrismaTransactionManager({ prisma });
    const userRepo = new PrismaUserRepository({ prisma });

    const id = nanoid();
    await expect(
      tm.run(async () => {
        await userRepo.create({ id, email: `${id}@example.com`, passwordHash: 'hash' });
        throw new Error('simulated failure');
      }),
    ).rejects.toThrow('simulated failure');

    const found = await userRepo.findById(id);
    expect(found).toBeNull();
    await cleanup();
  });

  it('reuses an ambient transaction when one is already active (no nested transaction)', async () => {
    const { prisma, cleanup } = await createTestDb();
    const tm = new PrismaTransactionManager({ prisma });
    const userRepo = new PrismaUserRepository({ prisma });

    let innerRunCount = 0;
    const outerSpy = vi.spyOn(prisma, '$transaction');

    // Outer transaction runs work + inner tm.run call
    const id = nanoid();
    await tm.run(async () => {
      innerRunCount++;
      await tm.run(async () => {
        innerRunCount++;
        await userRepo.create({ id, email: `${id}@example.com`, passwordHash: 'hash' });
      });
    });

    // Only one real $transaction call should have been made
    expect(outerSpy).toHaveBeenCalledOnce();
    expect(innerRunCount).toBe(2);

    const found = await userRepo.findById(id);
    expect(found).not.toBeNull();
    await cleanup();
  });
});
