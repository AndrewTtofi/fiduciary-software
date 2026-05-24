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
  return import("@/app/api/admin/document-requests/[id]/route");
}

afterEach(() => {
  sessionState.user = null;
  vi.resetModules();
});

async function createDocumentRequest(tx: PrismaClient, clientId: string, requestedById: string) {
  return tx.documentRequest.create({
    data: {
      clientId,
      requestedById,
      description: "Please provide proof of address",
      state: "open",
    },
  });
}

describe("admin/document-requests/[id] PATCH", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { PATCH } = await loadRoute(tx);
      await expect(
        PATCH(makeReq({ method: "PATCH", body: { state: "cancelled" } }), makeParams({ id: "any" }))
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
        PATCH(makeReq({ method: "PATCH", body: { state: "cancelled" } }), makeParams({ id: "any" }))
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  it("bad input (wrong state value) → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { state: "open" } }),
        makeParams({ id: "any" })
      );
      expect(res.status).toBe(422);
    });
  });

  it("cancel an open request → 200, state becomes cancelled", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const client = await createClient(tx);
      const staff = await createStaff(tx);
      const docReq = await createDocumentRequest(tx, client.id, staff.id);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { state: "cancelled" } }),
        makeParams({ id: docReq.id })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      const updated = await tx.documentRequest.findUnique({ where: { id: docReq.id } });
      expect(updated?.state).toBe("cancelled");
    });
  });

  it("cancel a fulfilled request → 400", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const client = await createClient(tx);
      const prospect = await tx.prospect.findUnique({ where: { id: client.prospectId } });
      const staff = await createStaff(tx);

      // Create fulfilled request
      const docReq = await tx.documentRequest.create({
        data: {
          clientId: client.id,
          requestedById: staff.id,
          description: "Please provide passport",
          state: "open",
        },
      });
      const doc = await tx.document.create({
        data: {
          prospectId: prospect!.id,
          type: "passport",
          storageKey: `prospects/${prospect!.id}/passport.pdf`,
          encMeta: { alg: "aes-256-gcm", ivB64: "a=", tagB64: "b=", keyId: "test" },
          originalName: "passport.pdf",
          mime: "application/pdf",
          sizeBytes: 2048,
          fulfillsRequest: { connect: { id: docReq.id } },
        },
      });
      await tx.documentRequest.update({
        where: { id: docReq.id },
        data: {
          state: "fulfilled",
          fulfilledById: staff.id,
          fulfilledAt: new Date(),
          fulfilledDocumentId: doc.id,
        },
      });

      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { state: "cancelled" } }),
        makeParams({ id: docReq.id })
      );
      expect(res.status).toBe(400);
    });
  });
});
