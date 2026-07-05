import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx, wrapTx } from "@/test/tx";
import { createStaff } from "@/test/seed";
import { makeReq } from "@/test/route";

let prisma: PrismaClient;
beforeAll(async () => { prisma = await getTestPrisma(); });
afterAll(async () => { await stopTestPrisma(); });

const sessionState = vi.hoisted(() => ({ user: null as null | { id: string; email: string; fullName: string; role: string } }));

vi.mock("@/lib/db", () => ({ prisma: undefined as unknown as PrismaClient }));
vi.mock("@/lib/auth/guards", () => ({
  assertRole: async (..._allowed: string[]) => {
    if (!sessionState.user) throw new Error("UNAUTHENTICATED");
    if (!_allowed.includes(sessionState.user.role)) throw new Error("FORBIDDEN");
    return sessionState.user;
  },
}));
// Mock argon2 to avoid hashing cost in tests
vi.mock("argon2", () => ({
  default: {
    hash: async (password: string) => `hashed:${password}`,
    argon2id: 2,
  },
}));

async function loadRoute(db: PrismaClient) {
  const dbMod = await import("@/lib/db");
  (dbMod as { prisma: PrismaClient }).prisma = db;
  return import("@/app/api/admin/users/route");
}

afterEach(() => {
  sessionState.user = null;
  vi.resetModules();
});

describe("admin/users POST", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { POST } = await loadRoute(tx);
      await expect(
        POST(makeReq({ method: "POST", body: { email: "new@test.local", fullName: "New Client" } }))
      ).rejects.toThrow();
    });
  });

  it("wrong role (client): throws FORBIDDEN", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = { id: "u1", email: "c@test.local", fullName: "Client", role: "client" };
      const { POST } = await loadRoute(tx);
      await expect(
        POST(makeReq({ method: "POST", body: { email: "new@test.local", fullName: "New Client" } }))
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  it("bad input (missing fullName) → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST", body: { email: "new@test.local" } }));
      expect(res.status).toBe(422);
    });
  });

  it("duplicate email → 409", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST", body: { email: staff.email, fullName: "Dup User" } })
      );
      expect(res.status).toBe(409);
    });
  });

  it("happy path: creates pre-verified prospect → 200 with tempPassword", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST", body: { email: "newclient@test.local", fullName: "New Client", phone: "+357 99123456" } })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(typeof json.tempPassword).toBe("string");
      const user = await tx.user.findUnique({ where: { email: "newclient@test.local" } });
      expect(user?.role).toBe("prospect");
      expect(user?.emailVerified).not.toBeNull();
      expect(user?.phone).toBe("+357 99123456");
      const activity = await tx.activityLog.findFirst({ where: { entityType: "user", entityId: user!.id, action: "user.created" } });
      expect(activity).not.toBeNull();
    });
  });
});
