import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx, wrapTx } from "@/test/tx";
import { createClient, createProspect, createStaff, createUser } from "@/test/seed";
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

async function loadRoute(db: PrismaClient) {
  const dbMod = await import("@/lib/db");
  (dbMod as { prisma: PrismaClient }).prisma = db;
  return import("@/app/api/admin/notes/route");
}

afterEach(() => {
  sessionState.user = null;
  vi.resetModules();
});

describe("admin/notes POST", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { POST } = await loadRoute(tx);
      await expect(
        POST(makeReq({ method: "POST", body: { clientId: "any", body: "Note text" } }))
      ).rejects.toThrow();
    });
  });

  it("wrong role (client): throws FORBIDDEN", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const client = await createClient(tx);
      const user = await tx.user.findUnique({ where: { id: client.userId } });
      sessionState.user = { id: user!.id, email: user!.email, fullName: user!.fullName, role: "client" };
      const { POST } = await loadRoute(tx);
      await expect(
        POST(makeReq({ method: "POST", body: { clientId: client.id, body: "Note text" } }))
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  it("bad input (no clientId or prospectId) → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST", body: { body: "A note without entity" } }));
      expect(res.status).toBe(422);
    });
  });

  it("bad input (empty body) → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST", body: { clientId: "some-id", body: "" } }));
      expect(res.status).toBe(422);
    });
  });

  it("staff posts note on client → 200, InternalNote created", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const client = await createClient(tx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST", body: { clientId: client.id, body: "Staff note here" } }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.id).toBeTruthy();
      const note = await tx.internalNote.findUnique({ where: { id: json.id } });
      expect(note?.clientId).toBe(client.id);
      expect(note?.body).toBe("Staff note here");
    });
  });

  it("partner posting a note on a prospect → 403", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const prospect = await createProspect(tx);
      const partner = await createUser(tx, { role: "partner" });
      sessionState.user = { id: partner.id, email: partner.email, fullName: partner.fullName, role: "partner" };
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST", body: { prospectId: prospect.id, body: "Partner note on prospect" } }));
      expect(res.status).toBe(403);
    });
  });

  it("partner without client assignment → 404", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const client = await createClient(tx);
      const partner = await createUser(tx, { role: "partner" });
      sessionState.user = { id: partner.id, email: partner.email, fullName: partner.fullName, role: "partner" };
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST", body: { clientId: client.id, body: "Partner unassigned note" } }));
      expect(res.status).toBe(404);
    });
  });

  it("partner assigned to client → 200, note created", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const client = await createClient(tx);
      const partner = await createUser(tx, { role: "partner" });
      // Assign partner via ClientService
      await tx.clientService.create({
        data: { clientId: client.id, serviceType: "audit", assignedPartnerId: partner.id },
      });
      sessionState.user = { id: partner.id, email: partner.email, fullName: partner.fullName, role: "partner" };
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST", body: { clientId: client.id, body: "Partner assigned note" } }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
    });
  });
});
