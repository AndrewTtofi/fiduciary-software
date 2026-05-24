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
  return import("@/app/api/admin/compliance/files/[id]/sign-off/route");
}

afterEach(() => {
  sessionState.user = null;
  vi.resetModules();
});

describe("admin/compliance/files/[id]/sign-off POST", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { POST } = await loadRoute(tx);
      await expect(
        POST(makeReq({ method: "POST", body: { note: "Signing off this file now." } }), makeParams({ id: "any-id" }))
      ).rejects.toThrow();
    });
  });

  it("wrong role (client): throws FORBIDDEN", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = { id: "x", email: "x@test.local", fullName: "X", role: "client" };
      const { POST } = await loadRoute(tx);
      await expect(
        POST(makeReq({ method: "POST", body: { note: "Signing off this file now." } }), makeParams({ id: "any-id" }))
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  it("bad input (missing note) → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST", body: {} }),
        makeParams({ id: "any-id" })
      );
      expect(res.status).toBe(422);
    });
  });

  it("party not passed → 400", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const cf = await createComplianceFile(tx, { riskRating: "low" });
      const party = await createParty(tx, { complianceFileId: cf.id });
      // KycCase state defaults to pending (not passed)
      await createKycCase(tx, { partyId: party.id, state: "pending" });
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST", body: { note: "Attempting sign-off now ok." } }),
        makeParams({ id: cf.id })
      );
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/not yet passed/i);
    });
  });

  it("riskRating null → 400", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      // no riskRating set
      const cf = await createComplianceFile(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST", body: { note: "Attempting sign-off now ok." } }),
        makeParams({ id: cf.id })
      );
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/risk rating/i);
    });
  });

  it("unreviewed hits → 400", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const cf = await createComplianceFile(tx, { riskRating: "low" });
      const party = await createParty(tx, { complianceFileId: cf.id });
      const kyc = await createKycCase(tx, { partyId: party.id, state: "passed" });
      // Create a screening run with an unreviewed hit
      const run = await tx.screeningRun.create({
        data: {
          kycCaseId: kyc.id,
          provider: "stub",
          query: {},
          outcome: "hits",
          hitCount: 1,
        },
      });
      await tx.kycCase.update({ where: { id: kyc.id }, data: { latestScreeningRunId: run.id } });
      await tx.screeningHit.create({
        data: {
          screeningRunId: run.id,
          externalId: "hit-1",
          matchedName: "John Doe",
          matchedSchema: "Person",
          matchedTopics: ["sanction"],
          matchScore: 0.9,
          matchedListings: {},
          reviewStatus: "unreviewed",
        },
      });
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST", body: { note: "Attempting sign-off now ok." } }),
        makeParams({ id: cf.id })
      );
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/unreviewed/i);
    });
  });

  it("happy path: all parties passed, no unreviewed hits, riskRating set → 200, status=cleared", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const cf = await createComplianceFile(tx, { riskRating: "low" });
      const party = await createParty(tx, { complianceFileId: cf.id });
      await createKycCase(tx, { partyId: party.id, state: "passed" });
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST", body: { note: "All checks passed, signing off now." } }),
        makeParams({ id: cf.id })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      const updated = await tx.complianceFile.findUnique({ where: { id: cf.id } });
      expect(updated?.status).toBe("cleared");
      expect(updated?.signedOffById).toBe(staff.id);
    });
  });
});
