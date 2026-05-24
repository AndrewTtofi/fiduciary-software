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
  return import("@/app/api/admin/compliance/hits/[id]/route");
}

afterEach(() => {
  sessionState.user = null;
  vi.resetModules();
});

/** Create a full hit chain: complianceFile → party → kycCase → screeningRun → screeningHit */
async function createHit(
  tx: PrismaClient,
  opts: { topics?: string[] } = {},
) {
  const cf = await createComplianceFile(tx);
  const party = await createParty(tx, { complianceFileId: cf.id });
  const kyc = await createKycCase(tx, { partyId: party.id });
  const run = await tx.screeningRun.create({
    data: {
      kycCaseId: kyc.id,
      provider: "stub",
      query: {},
      outcome: "hits",
      hitCount: 1,
    },
  });
  const hit = await tx.screeningHit.create({
    data: {
      screeningRunId: run.id,
      externalId: "ext-1",
      matchedName: "Test Person",
      matchedSchema: "Person",
      matchedTopics: opts.topics ?? ["sanction"],
      matchScore: 0.9,
      matchedListings: {},
      reviewStatus: "unreviewed",
    },
  });
  return { cf, party, kyc, run, hit };
}

describe("admin/compliance/hits/[id] PATCH", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { PATCH } = await loadRoute(tx);
      await expect(
        PATCH(makeReq({ method: "PATCH", body: { reviewStatus: "false_positive" } }), makeParams({ id: "any-id" }))
      ).rejects.toThrow();
    });
  });

  it("wrong role (client): throws FORBIDDEN", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = { id: "x", email: "x@test.local", fullName: "X", role: "client" };
      const { PATCH } = await loadRoute(tx);
      await expect(
        PATCH(makeReq({ method: "PATCH", body: { reviewStatus: "false_positive" } }), makeParams({ id: "any-id" }))
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  it("bad input (invalid reviewStatus) → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { reviewStatus: "ignored" } }),
        makeParams({ id: "any-id" })
      );
      expect(res.status).toBe(422);
    });
  });

  it("confirmed_match without note → 400", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const { hit } = await createHit(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { reviewStatus: "confirmed_match" } }),
        makeParams({ id: hit.id })
      );
      expect(res.status).toBe(400);
    });
  });

  it("happy path: false_positive → 200", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const { hit } = await createHit(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { reviewStatus: "false_positive" } }),
        makeParams({ id: hit.id })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      const updated = await tx.screeningHit.findUnique({ where: { id: hit.id } });
      expect(updated?.reviewStatus).toBe("false_positive");
    });
  });

  it("sanction hit confirmed_match → ComplianceFile.status=blocked + compliance.blocked log", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const { cf, hit } = await createHit(tx, { topics: ["sanction"] });
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { reviewStatus: "confirmed_match", note: "Confirmed sanction match." } }),
        makeParams({ id: hit.id })
      );
      expect(res.status).toBe(200);
      // Compliance file should be blocked
      const updatedFile = await tx.complianceFile.findUnique({ where: { id: cf.id } });
      expect(updatedFile?.status).toBe("blocked");
      // Activity log should have compliance.blocked
      const logs = await tx.activityLog.findMany({
        where: { entityId: cf.id, action: "compliance.blocked" },
      });
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  it("PEP topic confirmed_match → party.isPep flipped to true", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const { party, hit } = await createHit(tx, { topics: ["role.pep"] });
      // Confirm party starts non-PEP
      expect(party.isPep).toBe(false);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { reviewStatus: "confirmed_match", note: "Confirmed PEP match." } }),
        makeParams({ id: hit.id })
      );
      expect(res.status).toBe(200);
      const updatedParty = await tx.party.findUnique({ where: { id: party.id } });
      expect(updatedParty?.isPep).toBe(true);
    });
  });
});
