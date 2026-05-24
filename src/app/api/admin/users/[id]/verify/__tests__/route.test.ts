import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx, wrapTx } from "@/test/tx";
import { createStaff, createUser } from "@/test/seed";
import { makeReq, makeParams } from "@/test/route";

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
vi.mock("@/lib/providers/email", () => ({
  email: () => ({ send: async () => ({ ok: true }) }),
}));
vi.mock("@/lib/providers/storage", () => ({
  storage: () => ({
    put: async (_key: string, buf: Buffer, _mime: string) => ({
      key: _key,
      encMeta: { alg: "aes-256-gcm", ivB64: "aaa=", tagB64: "bbb=", keyId: "test" },
      sizeBytes: buf.byteLength,
    }),
    delete: async () => {},
    getStream: async () => { throw new Error("not implemented"); },
  }),
}));
vi.mock("@/lib/env", () => ({
  env: () => ({ APP_URL: "http://localhost:3000" }),
}));

async function loadRoute(db: PrismaClient) {
  const dbMod = await import("@/lib/db");
  (dbMod as { prisma: PrismaClient }).prisma = db;
  return import("@/app/api/admin/users/[id]/verify/route");
}

afterEach(() => {
  sessionState.user = null;
  vi.resetModules();
});

describe("admin/users/[id]/verify POST", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { POST } = await loadRoute(tx);
      await expect(
        POST(makeReq({ method: "POST" }), makeParams({ id: "any" }))
      ).rejects.toThrow();
    });
  });

  it("wrong role (client): throws FORBIDDEN", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const clientUser = await createUser(tx, { role: "client" });
      sessionState.user = { id: clientUser.id, email: clientUser.email, fullName: clientUser.fullName, role: "client" };
      const { POST } = await loadRoute(tx);
      await expect(
        POST(makeReq({ method: "POST" }), makeParams({ id: clientUser.id }))
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  it("user not found → 404", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST" }),
        makeParams({ id: "00000000-0000-0000-0000-000000000000" })
      );
      expect(res.status).toBe(404);
    });
  });

  it("verifies an unverified user → 200, emailVerified set", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      // Create user without email verification
      const unverifiedUser = await tx.user.create({
        data: {
          email: `unverified-${Date.now()}@test.local`,
          fullName: "Unverified User",
          role: "prospect",
          emailVerified: null,
          passwordHash: "x",
        },
      });
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST" }),
        makeParams({ id: unverifiedUser.id })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.alreadyVerified).toBeUndefined();
      const updated = await tx.user.findUnique({ where: { id: unverifiedUser.id } });
      expect(updated?.emailVerified).not.toBeNull();
    });
  });

  it("verifying an already-verified user → 200 with alreadyVerified: true", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      // createUser already sets emailVerified
      const alreadyVerified = await createUser(tx, { role: "prospect" });
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST" }),
        makeParams({ id: alreadyVerified.id })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.alreadyVerified).toBe(true);
    });
  });

  it("ActivityLog entry created after verification", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const unverifiedUser = await tx.user.create({
        data: {
          email: `log-test-${Date.now()}@test.local`,
          fullName: "Log Test User",
          role: "prospect",
          emailVerified: null,
          passwordHash: "x",
        },
      });
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      await POST(makeReq({ method: "POST" }), makeParams({ id: unverifiedUser.id }));
      const log = await tx.activityLog.findFirst({
        where: { entityType: "user", entityId: unverifiedUser.id, action: "user.email_verified" },
      });
      expect(log).not.toBeNull();
    });
  });
});
