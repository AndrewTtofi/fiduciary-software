import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx, wrapTx } from "@/test/tx";
import { createProspect, createStaff } from "@/test/seed";
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
vi.mock("@/lib/providers/notify", () => ({
  notify: () => ({ send: async () => ({ ok: true }) }),
}));

async function loadRoute(db: PrismaClient) {
  const dbMod = await import("@/lib/db");
  (dbMod as { prisma: PrismaClient }).prisma = db;
  return import("@/app/api/admin/clients/convert/route");
}

afterEach(() => {
  sessionState.user = null;
  vi.resetModules();
});

describe("admin/clients/convert POST", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { POST } = await loadRoute(tx);
      await expect(
        POST(makeReq({ method: "POST", body: { prospectId: "any" } }))
      ).rejects.toThrow();
    });
  });

  it("wrong role (client): throws FORBIDDEN", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      // Any non-staff user
      const prospect = await createProspect(tx);
      const user = await tx.user.findUnique({ where: { id: prospect.userId } });
      sessionState.user = { id: user!.id, email: user!.email, fullName: user!.fullName, role: "prospect" };
      const { POST } = await loadRoute(tx);
      await expect(
        POST(makeReq({ method: "POST", body: { prospectId: prospect.id } }))
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  it("bad input (missing prospectId) → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST", body: {} }));
      expect(res.status).toBe(422);
    });
  });

  it("prospect not found → 404", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST", body: { prospectId: "nonexistent-id" } }));
      expect(res.status).toBe(404);
    });
  });

  it("blocks conversion when compliance is not cleared → 409, no Client row created", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const prospect = await createProspect(tx, { status: "approved" });
      // ComplianceFile with open status (not cleared)
      await tx.complianceFile.create({ data: { prospectId: prospect.id, status: "open" } });
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST", body: { prospectId: prospect.id } }));
      expect(res.status).toBe(409);
      const clients = await tx.client.findMany({ where: { prospectId: prospect.id } });
      expect(clients).toHaveLength(0);
    });
  });

  it("happy path: approved prospect with cleared compliance → 200, Client row created", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const prospect = await createProspect(tx, { status: "approved" });
      // ComplianceFile with cleared status
      await tx.complianceFile.create({ data: { prospectId: prospect.id, status: "cleared" } });
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST", body: { prospectId: prospect.id } }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.clientId).toBeTruthy();
      const client = await tx.client.findUnique({ where: { id: json.clientId } });
      expect(client?.prospectId).toBe(prospect.id);
    });
  });

  it("prospect not yet approved → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const prospect = await createProspect(tx, { status: "pending" });
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST", body: { prospectId: prospect.id } }));
      expect(res.status).toBe(422);
    });
  });
});
