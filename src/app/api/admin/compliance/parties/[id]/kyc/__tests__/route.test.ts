import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx, wrapTx } from "@/test/tx";
import { createStaff, createComplianceFile, createParty, createKycCase } from "@/test/seed";
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
  return import("@/app/api/admin/compliance/parties/[id]/kyc/route");
}

afterEach(() => {
  sessionState.user = null;
  vi.resetModules();
});

describe("admin/compliance/parties/[id]/kyc PATCH", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { PATCH } = await loadRoute(tx);
      await expect(
        PATCH(makeReq({ method: "PATCH", body: { idvStatus: "verified" } }), makeParams({ id: "any-id" }))
      ).rejects.toThrow();
    });
  });

  it("wrong role (client): throws FORBIDDEN", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = { id: "x", email: "x@test.local", fullName: "X", role: "client" };
      const { PATCH } = await loadRoute(tx);
      await expect(
        PATCH(makeReq({ method: "PATCH", body: { idvStatus: "verified" } }), makeParams({ id: "any-id" }))
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  it("bad input (unknown field, strict schema) → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { unknownField: "bad" } }),
        makeParams({ id: "any-id" })
      );
      expect(res.status).toBe(422);
    });
  });

  it("idvStatus=failed without note → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const cf = await createComplianceFile(tx);
      const party = await createParty(tx, { complianceFileId: cf.id });
      await createKycCase(tx, { partyId: party.id });
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { idvStatus: "failed" } }),
        makeParams({ id: party.id })
      );
      expect(res.status).toBe(422);
    });
  });

  it("happy path: sets idvStatus=verified → 200, kycCase state=passed", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const cf = await createComplianceFile(tx);
      const party = await createParty(tx, { complianceFileId: cf.id });
      await createKycCase(tx, { partyId: party.id });
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { idvStatus: "verified" } }),
        makeParams({ id: party.id })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      const kyc = await tx.kycCase.findUnique({ where: { partyId: party.id } });
      expect(kyc?.idvStatus).toBe("verified");
      expect(kyc?.state).toBe("passed");
    });
  });

  it("happy path: sets idvStatus=failed with note → 200, kycCase state=blocked", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const cf = await createComplianceFile(tx);
      const party = await createParty(tx, { complianceFileId: cf.id });
      await createKycCase(tx, { partyId: party.id });
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { idvStatus: "failed", idvNote: "Documents appear altered." } }),
        makeParams({ id: party.id })
      );
      expect(res.status).toBe(200);
      const kyc = await tx.kycCase.findUnique({ where: { partyId: party.id } });
      expect(kyc?.idvStatus).toBe("failed");
      expect(kyc?.state).toBe("blocked");
    });
  });
});
