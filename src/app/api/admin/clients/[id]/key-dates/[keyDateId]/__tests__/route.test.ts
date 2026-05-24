import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx, wrapTx } from "@/test/tx";
import { createClient, createStaff } from "@/test/seed";
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
  return import("@/app/api/admin/clients/[id]/key-dates/[keyDateId]/route");
}

afterEach(() => {
  sessionState.user = null;
  vi.resetModules();
});

async function createKeyDate(tx: PrismaClient, clientId: string) {
  return tx.keyDate.create({
    data: { clientId, description: "Test date", dueDate: new Date("2026-12-31") },
  });
}

describe("admin/clients/[id]/key-dates/[keyDateId] PATCH", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { PATCH } = await loadRoute(tx);
      await expect(
        PATCH(makeReq({ method: "PATCH", body: { status: "completed" } }), makeParams({ id: "any", keyDateId: "any" }))
      ).rejects.toThrow();
    });
  });

  it("wrong role (client): throws FORBIDDEN", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const client = await createClient(tx);
      const user = await tx.user.findUnique({ where: { id: client.userId } });
      sessionState.user = { id: user!.id, email: user!.email, fullName: user!.fullName, role: "client" };
      const { PATCH } = await loadRoute(tx);
      await expect(
        PATCH(makeReq({ method: "PATCH", body: { status: "completed" } }), makeParams({ id: client.id, keyDateId: "any" }))
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  it("bad input (extra field) → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { badField: "nope" } }),
        makeParams({ id: "any", keyDateId: "any" })
      );
      expect(res.status).toBe(422);
    });
  });

  it("happy path: updates description → 200", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const client = await createClient(tx);
      const kd = await createKeyDate(tx, client.id);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { description: "Updated description" } }),
        makeParams({ id: client.id, keyDateId: kd.id })
      );
      expect(res.status).toBe(200);
      const updated = await tx.keyDate.findUnique({ where: { id: kd.id } });
      expect(updated?.description).toBe("Updated description");
    });
  });

  it("status flip to completed → ActivityLog client.key_date_completed row appears", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const client = await createClient(tx);
      const kd = await createKeyDate(tx, client.id);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { status: "completed" } }),
        makeParams({ id: client.id, keyDateId: kd.id })
      );
      expect(res.status).toBe(200);
      const updated = await tx.keyDate.findUnique({ where: { id: kd.id } });
      expect(updated?.status).toBe("completed");
      // ActivityLog should have a client.key_date_completed entry
      const log = await tx.activityLog.findFirst({
        where: { entityType: "client", entityId: client.id, action: "client.key_date_completed" },
      });
      expect(log).not.toBeNull();
    });
  });
});

describe("admin/clients/[id]/key-dates/[keyDateId] DELETE", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { DELETE } = await loadRoute(tx);
      await expect(
        DELETE(makeReq({ method: "DELETE" }), makeParams({ id: "any", keyDateId: "any" }))
      ).rejects.toThrow();
    });
  });

  it("happy path: deletes key date → 200", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const client = await createClient(tx);
      const kd = await createKeyDate(tx, client.id);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { DELETE } = await loadRoute(tx);
      const res = await DELETE(
        makeReq({ method: "DELETE" }),
        makeParams({ id: client.id, keyDateId: kd.id })
      );
      expect(res.status).toBe(200);
      const deleted = await tx.keyDate.findUnique({ where: { id: kd.id } });
      expect(deleted).toBeNull();
    });
  });
});
