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
  return import("@/app/api/admin/compliance/files/[id]/parties/route");
}

afterEach(() => {
  sessionState.user = null;
  vi.resetModules();
});

const validBody = {
  type: "individual",
  role: "ubo",
  fullName: "Jane Smith",
};

describe("admin/compliance/files/[id]/parties POST", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { POST } = await loadRoute(tx);
      await expect(
        POST(makeReq({ method: "POST", body: validBody }), makeParams({ id: "any-id" }))
      ).rejects.toThrow();
    });
  });

  it("wrong role (client): throws FORBIDDEN", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = { id: "x", email: "x@test.local", fullName: "X", role: "client" };
      const { POST } = await loadRoute(tx);
      await expect(
        POST(makeReq({ method: "POST", body: validBody }), makeParams({ id: "any-id" }))
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  it("bad input (missing required fields) → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST", body: { type: "individual" } }),
        makeParams({ id: "any-id" })
      );
      expect(res.status).toBe(422);
    });
  });

  it("happy path: creates party and kycCase → 200 with id", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const cf = await createComplianceFile(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST", body: { type: "individual", role: "ubo", fullName: "Jane Smith" } }),
        makeParams({ id: cf.id })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.id).toBeTruthy();
      // Verify party and kycCase created
      const party = await tx.party.findUnique({ where: { id: json.id } });
      expect(party?.fullName).toBe("Jane Smith");
      expect(party?.complianceFileId).toBe(cf.id);
      const kyc = await tx.kycCase.findUnique({ where: { partyId: json.id } });
      expect(kyc).not.toBeNull();
    });
  });

  it("happy path: creates entity party with registration number", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const cf = await createComplianceFile(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST", body: { type: "entity", role: "shareholder", fullName: "Acme Holdings Ltd", registrationNumber: "REG123456", jurisdiction: "GB" } }),
        makeParams({ id: cf.id })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      const party = await tx.party.findUnique({ where: { id: json.id } });
      expect(party?.type).toBe("entity");
      expect(party?.registrationNumber).toBe("REG123456");
    });
  });
});
