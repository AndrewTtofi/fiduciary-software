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

afterEach(() => {
  sessionState.user = null;
  vi.resetModules();
});

/**
 * Load the route and also set the screening provider stub on the freshly-
 * imported module instance. vi.resetModules() resets the module registry on
 * every test, so the static `cached` variable in screening.ts is reset to
 * undefined each time. We must inject the stub AFTER the fresh import.
 */
async function loadRoute(db: PrismaClient, provider?: { name: string; match: (q: unknown) => Promise<{ outcome: string; hits: unknown[]; raw: unknown }> }) {
  const dbMod = await import("@/lib/db");
  (dbMod as { prisma: PrismaClient }).prisma = db;
  const screeningMod = await import("@/lib/providers/screening");
  const stub = provider ?? {
    name: "stub",
    match: async () => ({ outcome: "clear" as const, hits: [], raw: {} }),
  };
  screeningMod.__setScreeningProviderForTests(stub as Parameters<typeof screeningMod.__setScreeningProviderForTests>[0]);
  return import("@/app/api/admin/compliance/parties/[id]/screen/route");
}

describe("admin/compliance/parties/[id]/screen POST", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { POST } = await loadRoute(tx);
      await expect(
        POST(makeReq({ method: "POST" }), makeParams({ id: "any-id" }))
      ).rejects.toThrow();
    });
  });

  it("wrong role (client): throws FORBIDDEN", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = { id: "x", email: "x@test.local", fullName: "X", role: "client" };
      const { POST } = await loadRoute(tx);
      await expect(
        POST(makeReq({ method: "POST" }), makeParams({ id: "any-id" }))
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  it("party not found (no KycCase) → 404", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST" }),
        makeParams({ id: "00000000-0000-0000-0000-000000000000" })
      );
      expect(res.status).toBe(404);
    });
  });

  it("happy path: creates ScreeningRun with clear outcome → 200", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const cf = await createComplianceFile(tx);
      const party = await createParty(tx, { complianceFileId: cf.id });
      await createKycCase(tx, { partyId: party.id });
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST" }),
        makeParams({ id: party.id })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.runId).toBeTruthy();
      expect(json.outcome).toBe("clear");
      expect(json.hitCount).toBe(0);
      // Verify ScreeningRun row created
      const run = await tx.screeningRun.findUnique({ where: { id: json.runId } });
      expect(run).not.toBeNull();
      expect(run?.outcome).toBe("clear");
      expect(run?.provider).toBe("stub");
    });
  });

  it("screening with hits: creates ScreeningRun with hits outcome → 200", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const cf = await createComplianceFile(tx);
      const party = await createParty(tx, { complianceFileId: cf.id });
      await createKycCase(tx, { partyId: party.id });
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const hitsProvider = {
        name: "stub",
        match: async () => ({
          outcome: "hits" as const,
          hits: [{
            externalId: "ext-1",
            matchedName: "John Doe",
            matchedSchema: "Person",
            matchedTopics: ["sanction"],
            matchScore: 0.95,
            matchedListings: {},
          }],
          raw: {},
        }),
      };
      const { POST } = await loadRoute(tx, hitsProvider);
      const res = await POST(
        makeReq({ method: "POST" }),
        makeParams({ id: party.id })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.outcome).toBe("hits");
      expect(json.hitCount).toBe(1);
      const hits = await tx.screeningHit.findMany({ where: { screeningRunId: json.runId } });
      expect(hits).toHaveLength(1);
      expect(hits[0].matchedTopics).toContain("sanction");
    });
  });
});
