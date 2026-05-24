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
  return import("@/app/api/admin/clients/[id]/services/[serviceId]/route");
}

afterEach(() => {
  sessionState.user = null;
  vi.resetModules();
});

async function createServiceForClient(tx: PrismaClient, clientId: string) {
  return tx.clientService.create({
    data: { clientId, serviceType: "audit", status: "pending" },
  });
}

describe("admin/clients/[id]/services/[serviceId] PATCH", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { PATCH } = await loadRoute(tx);
      await expect(
        PATCH(makeReq({ method: "PATCH", body: { status: "in_progress" } }), makeParams({ id: "any", serviceId: "any" }))
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
        PATCH(makeReq({ method: "PATCH", body: { status: "in_progress" } }), makeParams({ id: client.id, serviceId: "any" }))
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  it("bad input (invalid status) → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { status: "invalid_status" } }),
        makeParams({ id: "any", serviceId: "any" })
      );
      expect(res.status).toBe(422);
    });
  });

  it("happy path: updates service status → 200", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const client = await createClient(tx);
      const svc = await createServiceForClient(tx, client.id);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { status: "completed" } }),
        makeParams({ id: client.id, serviceId: svc.id })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      const updated = await tx.clientService.findUnique({ where: { id: svc.id } });
      expect(updated?.status).toBe("completed");
    });
  });
});

describe("admin/clients/[id]/services/[serviceId] DELETE", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { DELETE } = await loadRoute(tx);
      await expect(
        DELETE(makeReq({ method: "DELETE" }), makeParams({ id: "any", serviceId: "any" }))
      ).rejects.toThrow();
    });
  });

  it("happy path: removes service → 200", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const client = await createClient(tx);
      const svc = await createServiceForClient(tx, client.id);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { DELETE } = await loadRoute(tx);
      const res = await DELETE(
        makeReq({ method: "DELETE" }),
        makeParams({ id: client.id, serviceId: svc.id })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      const deleted = await tx.clientService.findUnique({ where: { id: svc.id } });
      expect(deleted).toBeNull();
    });
  });

  it("DELETE service with docs assigned: succeeds and docs remain intact", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const client = await createClient(tx);
      const svc = await createServiceForClient(tx, client.id);
      // Create a doc that references this service type (not linked by FK, just serviceTypeKey)
      const prospect = await tx.prospect.findUnique({ where: { id: client.prospectId } });
      const doc = await tx.document.create({
        data: {
          prospectId: prospect!.id,
          type: "other",
          storageKey: "prospects/test/doc.pdf",
          encMeta: { alg: "aes-256-gcm", ivB64: "a=", tagB64: "b=", keyId: "test" },
          originalName: "doc.pdf",
          mime: "application/pdf",
          sizeBytes: 100,
          serviceTypeKey: svc.serviceType,
        },
      });
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { DELETE } = await loadRoute(tx);
      const res = await DELETE(
        makeReq({ method: "DELETE" }),
        makeParams({ id: client.id, serviceId: svc.id })
      );
      expect(res.status).toBe(200);
      // Service is gone
      const deletedSvc = await tx.clientService.findUnique({ where: { id: svc.id } });
      expect(deletedSvc).toBeNull();
      // Document still intact (lose folder bucketing, doc survives)
      const stillDoc = await tx.document.findUnique({ where: { id: doc.id } });
      expect(stillDoc).not.toBeNull();
    });
  });
});
