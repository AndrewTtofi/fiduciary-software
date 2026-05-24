import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx, wrapTx } from "@/test/tx";
import { createStaff, createComplianceFile } from "@/test/seed";
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
  return import("@/app/api/admin/compliance/files/[id]/route");
}

afterEach(() => {
  sessionState.user = null;
  vi.resetModules();
});

describe("admin/compliance/files/[id] GET", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { GET } = await loadRoute(tx);
      await expect(
        GET(makeReq({ method: "GET" }), makeParams({ id: "any-id" }))
      ).rejects.toThrow();
    });
  });

  it("wrong role (client): throws FORBIDDEN", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "client" };
      const { GET } = await loadRoute(tx);
      await expect(
        GET(makeReq({ method: "GET" }), makeParams({ id: "any-id" }))
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  it("not found → 404", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { GET } = await loadRoute(tx);
      const res = await GET(
        makeReq({ method: "GET" }),
        makeParams({ id: "00000000-0000-0000-0000-000000000000" })
      );
      expect(res.status).toBe(404);
    });
  });

  it("happy path: returns compliance file → 200", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const cf = await createComplianceFile(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { GET } = await loadRoute(tx);
      const res = await GET(
        makeReq({ method: "GET" }),
        makeParams({ id: cf.id })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.file).toBeDefined();
      expect(json.file.id).toBe(cf.id);
    });
  });
});
