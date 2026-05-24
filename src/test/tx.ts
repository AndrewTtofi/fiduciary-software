import type { PrismaClient } from "@prisma/client";

class RollbackSignal extends Error { constructor() { super("__rollback__"); } }

/**
 * Runs `fn` inside a Prisma transaction that is always rolled back at the end,
 * leaving the DB clean for the next test. Returns whatever fn returns.
 */
export async function inRollbackTx<T>(prisma: PrismaClient, fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
  let result!: T;
  await prisma.$transaction(async (tx) => {
    result = await fn(tx as unknown as PrismaClient);
    throw new RollbackSignal();
  }).catch((e) => { if (!(e instanceof RollbackSignal)) throw e; });
  return result;
}
