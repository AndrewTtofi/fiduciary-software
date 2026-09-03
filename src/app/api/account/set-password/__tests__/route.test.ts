import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx, wrapTx } from "@/test/tx";
import { createUser } from "@/test/seed";
import { makeReq } from "@/test/route";

let prisma: PrismaClient;
beforeAll(async () => { prisma = await getTestPrisma(); });
afterAll(async () => { await stopTestPrisma(); });

const sessionState = vi.hoisted(() => ({ user: null as null | { id: string; email: string; fullName: string; role: string } }));

vi.mock("@/lib/db", () => ({ prisma: undefined as unknown as PrismaClient }));
vi.mock("@/lib/auth/guards", () => ({
  assertRole: async (...allowed: string[]) => {
    if (!sessionState.user) throw new Error("UNAUTHENTICATED");
    if (!allowed.includes(sessionState.user.role)) throw new Error("FORBIDDEN");
    return sessionState.user;
  },
}));
vi.mock("argon2", () => ({ default: { hash: async (p: string) => `hashed:${p}`, argon2id: 2 } }));

async function loadRoute(db: PrismaClient) {
  const dbMod = await import("@/lib/db");
  (dbMod as { prisma: PrismaClient }).prisma = db;
  return import("@/app/api/account/set-password/route");
}

afterEach(() => { sessionState.user = null; vi.resetModules(); });

describe("POST /api/account/set-password", () => {
  it("sets a first password for an account without one", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const u = await tx.user.create({ data: { email: `np-${Date.now()}@example.com`, fullName: "No Pass", role: "prospect", emailVerified: new Date() } });
      sessionState.user = { id: u.id, email: u.email, fullName: u.fullName, role: "prospect" };
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST", body: { password: "longenough1" } }));
      expect(res.status).toBe(200);
      const after = await tx.user.findUnique({ where: { id: u.id } });
      expect(after!.passwordHash).toBe("hashed:longenough1");
      expect(await tx.activityLog.count({ where: { entityId: u.id, action: "user.password_set" } })).toBe(1);
    });
  });

  it("refuses when a password already exists (409) and enforces the policy (422)", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const u = await createUser(tx, { role: "prospect" }); // passwordHash "x"
      sessionState.user = { id: u.id, email: u.email, fullName: u.fullName, role: "prospect" };
      const { POST } = await loadRoute(tx);
      expect((await POST(makeReq({ method: "POST", body: { password: "longenough1" } }))).status).toBe(409);
      expect((await POST(makeReq({ method: "POST", body: { password: "short" } }))).status).toBe(422);
    });
  });

  it("requires a session", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const { POST } = await loadRoute(tx);
      await expect(POST(makeReq({ method: "POST", body: { password: "longenough1" } }))).rejects.toThrow("UNAUTHENTICATED");
    });
  });
});
